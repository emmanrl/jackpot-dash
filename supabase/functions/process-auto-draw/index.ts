import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

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

    console.log('Processing automatic draws...');

    // Get all active jackpots that are due
    const { data: dueJackpots, error: jackpotsError } = await supabase
      .from('jackpots')
      .select('*')
      .eq('status', 'active')
      .lte('next_draw', new Date().toISOString());

    if (jackpotsError) throw jackpotsError;

    if (!dueJackpots || dueJackpots.length === 0) {
      console.log('No jackpots due for drawing');
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No jackpots due' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${dueJackpots.length} jackpots due for drawing`);

    const results = [];

    for (const jackpot of dueJackpots) {
      try {
        // Get all tickets for this jackpot
        const { data: tickets, error: ticketsError } = await supabase
          .from('tickets')
          .select('*')
          .eq('jackpot_id', jackpot.id);

        if (ticketsError) throw ticketsError;

        if (!tickets || tickets.length === 0) {
          console.log(`No tickets for jackpot ${jackpot.id}, skipping draw`);
          // Reset jackpot with new draw time
          const nextDraw = calculateNextDrawTime(jackpot.frequency);
          await supabase
            .from('jackpots')
            .update({ next_draw: nextDraw, prize_pool: 0 })
            .eq('id', jackpot.id);
          continue;
        }

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

        console.log(`Processing draw for ${jackpot.name}: ${winnersCount} winners`);

        // Create draw record for first winner
        const { data: draw, error: drawError } = await supabase
          .from('draws')
          .insert({
            jackpot_id: jackpot.id,
            winning_ticket_id: winningTickets[0].id,
            prize_amount: calculatePrize(1),
            total_tickets: tickets.length,
            drawn_at: new Date().toISOString()
          })
          .select()
          .single();

        if (drawError || !draw) {
          console.error(`Failed to create draw record:`, drawError);
          continue;
        }

        // Process each winner
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
              jackpot_id: jackpot.id,
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

          // Update winner's wallet
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

          // Create transaction record
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              user_id: ticket.user_id,
              type: 'prize_win',
              amount: prize,
              status: 'completed',
              reference: `Auto Draw ${draw.id} - Rank ${rank}`
            });

          if (txError) {
            console.error(`Failed to create transaction for rank ${rank}:`, txError);
          }

          // Send notification with rank info
          const rankLabels = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
          const rankLabel = rank <= 3 ? rankLabels[rank - 1] : `🎖️ ${rank}th Place`;
          
          await supabase.from('notifications').insert({
            user_id: ticket.user_id,
            type: 'jackpot_win',
            title: `🎉 Congratulations! You Won ${rankLabel}!`,
            message: `You won ₦${prize.toFixed(2)} in ${jackpot.name}! The prize has been added to your wallet.`,
            is_read: false,
            data: {
              jackpot_id: jackpot.id,
              draw_id: draw.id,
              prize_amount: prize,
              winner_rank: rank,
              total_participants: tickets.length,
              total_pool: totalPool
            }
          });
        }

        // Update or create admin wallet balance (20% of pool)
        await supabase.rpc('increment_admin_wallet', {
          p_amount: adminShare
        });

        // Update jackpot status
        await supabase
          .from('jackpots')
          .update({ 
            status: 'completed',
            draw_time: new Date().toISOString()
          })
          .eq('id', jackpot.id);

        console.log(`Auto-draw completed for jackpot ${jackpot.id}. ${winningTickets.length} winners processed`);

        // Create next jackpot based on frequency
        const nextDrawTime = calculateNextDrawTime(jackpot.frequency);
        const { data: nextJackpot, error: nextJackpotError} = await supabase
          .from('jackpots')
          .insert({
            name: jackpot.name,
            description: jackpot.description,
            ticket_price: jackpot.ticket_price,
            prize_pool: 0,
            category: jackpot.category,
            frequency: jackpot.frequency,
            next_draw: nextDrawTime,
            expires_at: nextDrawTime,
            status: 'active',
            winners_count: jackpot.winners_count || 1,
          })
          .select()
          .single();

        if (nextJackpotError) {
          console.error('Failed to create next jackpot:', nextJackpotError);
        } else {
          console.log(`Created next ${jackpot.frequency} jackpot ${nextJackpot.id}, draw at ${nextDrawTime}`);
        }

        results.push({
          jackpot_id: jackpot.id,
          draw_id: draw.id,
          winners_count: winningTickets.length,
          admin_share: adminShare
        });
      } catch (error: any) {
        console.error(`Error processing jackpot ${jackpot.id}:`, error);
        results.push({
          jackpot_id: jackpot.id,
          error: error.message || 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in process-auto-draw:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

function calculateNextDrawTime(frequency: string): string {
  const now = new Date();
  
  switch (frequency) {
    case '5minutes':
      now.setMinutes(now.getMinutes() + 5);
      break;
    case 'hourly':
      now.setHours(now.getHours() + 1);
      break;
    case '12hours':
      now.setHours(now.getHours() + 12);
      break;
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      now.setHours(now.getHours() + 1);
  }
  
  return now.toISOString();
}
