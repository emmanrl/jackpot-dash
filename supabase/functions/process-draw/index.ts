import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { jackpot_id } = await req.json();

    if (!jackpot_id) {
      throw new Error('Jackpot ID is required');
    }

    console.log(`Processing draw for jackpot ${jackpot_id} triggered by admin ${user.id}`);

    // Get the jackpot details
    const { data: jackpot, error: jackpotError } = await supabase
      .from('jackpots')
      .select('*')
      .eq('id', jackpot_id)
      .single();

    if (jackpotError || !jackpot) {
      throw new Error('Jackpot not found');
    }

    if (jackpot.status !== 'active') {
      throw new Error('Jackpot is not active');
    }

    // Get all tickets for this jackpot
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('jackpot_id', jackpot_id);

    if (ticketsError) {
      throw new Error(`Failed to fetch tickets: ${ticketsError.message}`);
    }

    if (!tickets || tickets.length === 0) {
      throw new Error('No tickets available for this jackpot');
    }

    console.log(`Found ${tickets.length} tickets for the draw`);

    // Select random winner
    const randomIndex = Math.floor(Math.random() * tickets.length);
    const winningTicket = tickets[randomIndex];
    const totalPool = parseFloat(jackpot.prize_pool);
    
    // Calculate 80% for winner, 20% for admin
    const winnerPrize = totalPool * 0.8;
    const adminShare = totalPool * 0.2;

    console.log(`Winner selected: ticket ${winningTicket.id}, user ${winningTicket.user_id}, winner prize ${winnerPrize}, admin share ${adminShare}`);

    // Create draw record
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        jackpot_id: jackpot_id,
        winning_ticket_id: winningTicket.id,
        prize_amount: winnerPrize,
        total_tickets: tickets.length,
        drawn_at: new Date().toISOString()
      })
      .select()
      .single();

    if (drawError || !draw) {
      throw new Error(`Failed to create draw record: ${drawError?.message}`);
    }

    // Create winner record with additional details
    const { error: winnerError } = await supabase
      .from('winners')
      .insert({
        user_id: winningTicket.user_id,
        jackpot_id: jackpot_id,
        draw_id: draw.id,
        ticket_id: winningTicket.id,
        prize_amount: winnerPrize,
        total_participants: tickets.length,
        total_pool_amount: totalPool,
        claimed_at: new Date().toISOString()
      });

    if (winnerError) {
      throw new Error(`Failed to create winner record: ${winnerError.message}`);
    }

    // Update winner's wallet balance (80% of pool)
    await supabase.rpc('increment_wallet_balance', {
      p_user_id: winningTicket.user_id,
      p_amount: winnerPrize
    });

    // Award XP for winning (10 XP per win)
    await supabase.rpc('award_experience_points', {
      p_user_id: winningTicket.user_id,
      p_amount: 10
    });

    console.log('Winner wallet updated with prize and XP awarded');

    // Update or create admin wallet balance (20% of pool)
    const { data: adminWallet, error: adminWalletError } = await supabase
      .from('admin_wallet')
      .select('id, balance')
      .limit(1)
      .single();

    if (!adminWalletError && adminWallet) {
      const newAdminBalance = parseFloat(adminWallet.balance) + adminShare;
      await supabase
        .from('admin_wallet')
        .update({ balance: newAdminBalance })
        .eq('id', adminWallet.id);
    } else if (adminWalletError) {
      // If table exists but no row found, insert a new one
      await supabase
        .from('admin_wallet')
        .insert({ balance: adminShare });
    }

    // Create win transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: winningTicket.user_id,
        type: 'prize_win',
        amount: winnerPrize,
        status: 'completed',
        reference: `Draw ${draw.id}`,
        processed_by: user.id,
        processed_at: new Date().toISOString()
      });

    if (txError) {
      console.error('Failed to create transaction record:', txError);
    }

    // Create winner notification
    await supabase.from('notifications').insert({
      user_id: winningTicket.user_id,
      type: 'jackpot_win',
      title: '🎉 Congratulations! You Won!',
      message: `You won ₦${winnerPrize.toFixed(2)} in ${jackpot.name}! The prize has been added to your wallet.`,
      is_read: false,
      data: {
        jackpot_id: jackpot_id,
        draw_id: draw.id,
        prize_amount: winnerPrize,
        total_participants: tickets.length,
        total_pool: totalPool
      }
    });

    // Update jackpot status
    const { error: updateJackpotError } = await supabase
      .from('jackpots')
      .update({ 
        status: 'completed',
        draw_time: new Date().toISOString()
      })
      .eq('id', jackpot_id);

    if (updateJackpotError) {
      console.error('Failed to update jackpot status:', updateJackpotError);
    }

    console.log(`Draw completed successfully. Winner: ${winningTicket.user_id}, Prize: ${winnerPrize}, Admin share: ${adminShare}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        draw_id: draw.id,
        winner: {
          user_id: winningTicket.user_id,
          ticket_id: winningTicket.id,
          prize_amount: winnerPrize,
          admin_share: adminShare
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in process-draw:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
