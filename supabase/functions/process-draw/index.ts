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

    // Get winners count from jackpot (default to 1)
    const winnersCount = Math.min(jackpot.winners_count || 1, tickets.length);
    
    // Select random winners (no duplicates)
    const shuffledTickets = [...tickets].sort(() => Math.random() - 0.5);
    const winningTickets = shuffledTickets.slice(0, winnersCount);

    // Calculate prize distribution
    const totalPool = parseFloat(jackpot.prize_pool);
    const adminShare = totalPool * 0.2;
    const prizePool = totalPool * 0.8;
    
    // Prize distribution tiers: 60% for 1st, 25% for 2nd-4th, 15% for 5th-10th
    const calculatePrize = (rank: number) => {
      if (winnersCount === 1) return prizePool;
      if (rank === 1) return prizePool * 0.6;
      if (rank >= 2 && rank <= 4) return (prizePool * 0.25) / Math.min(3, winnersCount - 1);
      return (prizePool * 0.15) / Math.max(1, winnersCount - 4);
    };

    console.log(`Winners selected: ${winnersCount} winners, admin share ${adminShare}`);

    // Create draw record for first winner
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        jackpot_id: jackpot_id,
        winning_ticket_id: winningTickets[0].id,
        prize_amount: calculatePrize(1),
        total_tickets: tickets.length,
        drawn_at: new Date().toISOString()
      })
      .select()
      .single();

    if (drawError || !draw) {
      throw new Error(`Failed to create draw record: ${drawError?.message}`);
    }

    // Process each winner
    const winnersData = [];
    for (let i = 0; i < winningTickets.length; i++) {
      const ticket = winningTickets[i];
      const rank = i + 1;
      const prize = calculatePrize(rank);
      
      // Determine XP based on rank
      let xpReward = 25;
      if (rank === 1) xpReward = 100;
      else if (rank >= 2 && rank <= 4) xpReward = 50;

      // Create winner record
      const { error: winnerError } = await supabase
        .from('winners')
        .insert({
          user_id: ticket.user_id,
          jackpot_id: jackpot_id,
          draw_id: draw.id,
          ticket_id: ticket.id,
          prize_amount: prize,
          winner_rank: rank,
          total_participants: tickets.length,
          total_pool_amount: totalPool,
          claimed_at: new Date().toISOString()
        });

      if (winnerError) {
        console.error(`Failed to create winner record for rank ${rank}:`, winnerError);
        continue;
      }

      // Update winner's wallet balance
      await supabase.rpc('increment_wallet_balance', {
        p_user_id: ticket.user_id,
        p_amount: prize
      });

      // Award XP for winning
      await supabase.rpc('award_experience_points', {
        p_user_id: ticket.user_id,
        p_amount: xpReward
      });

      // Check and award achievements
      await supabase.rpc('check_and_award_achievements', {
        p_user_id: ticket.user_id
      });

      // Award referral commission (1% of winner's prize)
      await supabase.rpc('award_referral_commission' as any, {
        p_winner_id: ticket.user_id,
        p_prize_amount: prize
      });

      // Create win transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: ticket.user_id,
          type: 'prize_win',
          amount: prize,
          status: 'completed',
          reference: `Draw ${draw.id} - Rank ${rank}`,
          processed_by: user.id,
          processed_at: new Date().toISOString()
        });

      if (txError) {
        console.error(`Failed to create transaction for rank ${rank}:`, txError);
      }

      // Create winner notification with rank info
      const rankLabels = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
      const rankLabel = rank <= 3 ? rankLabels[rank - 1] : `🎖️ ${rank}th Place`;
      
      await supabase.from('notifications').insert({
        user_id: ticket.user_id,
        type: 'jackpot_win',
        title: `🎉 Congratulations! You Won ${rankLabel}!`,
        message: `You won ₦${prize.toFixed(2)} in ${jackpot.name}! The prize has been added to your wallet.`,
        is_read: false,
        data: {
          jackpot_id: jackpot_id,
          draw_id: draw.id,
          prize_amount: prize,
          winner_rank: rank,
          total_participants: tickets.length,
          total_pool: totalPool
        }
      });

      winnersData.push({
        user_id: ticket.user_id,
        ticket_id: ticket.id,
        prize_amount: prize,
        rank: rank
      });
    }

    console.log(`${winnersData.length} winners processed with prizes and XP awarded`);

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

    console.log(`Draw completed successfully. Winners: ${winnersData.length}, Admin share: ${adminShare}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        draw_id: draw.id,
        winners: winnersData,
        admin_share: adminShare
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
