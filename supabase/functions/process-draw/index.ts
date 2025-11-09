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
    const prizeAmount = parseFloat(jackpot.prize_pool);

    console.log(`Winner selected: ticket ${winningTicket.id}, user ${winningTicket.user_id}, prize ${prizeAmount}`);

    // Create draw record
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        jackpot_id: jackpot_id,
        winning_ticket_id: winningTicket.id,
        prize_amount: prizeAmount,
        total_tickets: tickets.length,
        drawn_at: new Date().toISOString()
      })
      .select()
      .single();

    if (drawError || !draw) {
      throw new Error(`Failed to create draw record: ${drawError?.message}`);
    }

    // Create winner record
    const { error: winnerError } = await supabase
      .from('winners')
      .insert({
        user_id: winningTicket.user_id,
        jackpot_id: jackpot_id,
        draw_id: draw.id,
        ticket_id: winningTicket.id,
        prize_amount: prizeAmount,
        claimed_at: new Date().toISOString()
      });

    if (winnerError) {
      throw new Error(`Failed to create winner record: ${winnerError.message}`);
    }

    // Update winner's wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', winningTicket.user_id)
      .single();

    if (walletError || !wallet) {
      throw new Error('Winner wallet not found');
    }

    const newBalance = parseFloat(wallet.balance) + prizeAmount;
    const { error: balanceError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', winningTicket.user_id);

    if (balanceError) {
      throw new Error(`Failed to update wallet balance: ${balanceError.message}`);
    }

    // Create win transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: winningTicket.user_id,
        type: 'win',
        amount: prizeAmount,
        status: 'completed',
        reference: `Draw ${draw.id}`,
        processed_by: user.id,
        processed_at: new Date().toISOString()
      });

    if (txError) {
      console.error('Failed to create transaction record:', txError);
    }

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

    console.log(`Draw completed successfully. Winner: ${winningTicket.user_id}, Prize: ${prizeAmount}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        draw_id: draw.id,
        winner: {
          user_id: winningTicket.user_id,
          ticket_id: winningTicket.id,
          prize_amount: prizeAmount
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
