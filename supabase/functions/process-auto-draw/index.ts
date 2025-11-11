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
          const nextDraw = calculateNextDraw(jackpot.frequency);
          await supabase
            .from('jackpots')
            .update({ next_draw: nextDraw, prize_pool: 0 })
            .eq('id', jackpot.id);
          continue;
        }

        // Select random winner
        const randomIndex = Math.floor(Math.random() * tickets.length);
        const winningTicket = tickets[randomIndex];
        const totalPool = parseFloat(jackpot.prize_pool);
        
        // Calculate 80% for winner, 20% for admin
        const winnerPrize = totalPool * 0.8;
        const adminShare = totalPool * 0.2;

        console.log(`Processing draw for ${jackpot.name}: Winner ${winningTicket.user_id}, Prize ${winnerPrize}`);

        // Create draw record
        const { data: draw, error: drawError } = await supabase
          .from('draws')
          .insert({
            jackpot_id: jackpot.id,
            winning_ticket_id: winningTicket.id,
            prize_amount: winnerPrize,
            total_tickets: tickets.length,
          })
          .select()
          .single();

        if (drawError) throw drawError;

        // Create winner record
        await supabase.from('winners').insert({
          user_id: winningTicket.user_id,
          jackpot_id: jackpot.id,
          draw_id: draw.id,
          ticket_id: winningTicket.id,
          prize_amount: winnerPrize,
          total_participants: tickets.length,
          total_pool_amount: totalPool,
        });

        // Update winner's wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', winningTicket.user_id)
          .single();

        if (wallet) {
          await supabase
            .from('wallets')
            .update({ balance: parseFloat(wallet.balance) + winnerPrize })
            .eq('user_id', winningTicket.user_id);
        }

        // Update admin wallet
        const { data: adminWallet } = await supabase
          .from('admin_wallet')
          .select('*')
          .limit(1)
          .single();

        if (adminWallet) {
          await supabase
            .from('admin_wallet')
            .update({ balance: parseFloat(adminWallet.balance) + adminShare })
            .eq('id', adminWallet.id);
        }

        // Create win transaction record
        await supabase
          .from('transactions')
          .insert({
            user_id: winningTicket.user_id,
            type: 'prize_win',
            amount: winnerPrize,
            status: 'completed',
            reference: `Auto Draw ${jackpot.name}`,
          });

        // Create winner notification
        await supabase.from('notifications').insert({
          user_id: winningTicket.user_id,
          type: 'jackpot_win',
          title: '🎉 Congratulations! You Won!',
          message: `You won ₦${winnerPrize.toFixed(2)} in ${jackpot.name}! The prize has been added to your wallet.`,
          data: {
            jackpot_id: jackpot.id,
            draw_id: draw.id,
            prize_amount: winnerPrize,
            total_participants: tickets.length,
            total_pool: totalPool,
          },
        });

        // Calculate next draw time
        const nextDraw = calculateNextDraw(jackpot.frequency);

        // Update jackpot - set to completed and create new one
        await supabase
          .from('jackpots')
          .update({ status: 'completed', draw_time: new Date().toISOString() })
          .eq('id', jackpot.id);

        // Create new jackpot for next draw
        const { data: maxJackpot } = await supabase
          .from('jackpots')
          .select('jackpot_number')
          .order('jackpot_number', { ascending: false })
          .limit(1)
          .single();

        const nextJackpotNumber = (maxJackpot?.jackpot_number || 0) + 1;

        await supabase.from('jackpots').insert({
          name: jackpot.name,
          description: jackpot.description,
          frequency: jackpot.frequency,
          ticket_price: jackpot.ticket_price,
          prize_pool: 0,
          next_draw: nextDraw,
          status: 'active',
          jackpot_number: nextJackpotNumber,
        });

        // Notify all users about new draw
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id');

        if (allUsers) {
          const notifications = allUsers.map(user => ({
            user_id: user.id,
            type: 'new_draw',
            title: '🎰 New Draw Available',
            message: `${jackpot.name} is now open! Get your tickets before ${new Date(nextDraw).toLocaleString()}`,
            data: { jackpot_id: jackpot.id },
          }));

          await supabase.from('notifications').insert(notifications);
        }

        results.push({
          jackpot_id: jackpot.id,
          winner_id: winningTicket.user_id,
          prize: winnerPrize,
        });
      } catch (error: any) {
        console.error(`Error processing jackpot ${jackpot.id}:`, error);
        results.push({
          jackpot_id: jackpot.id,
          error: error?.message || 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Auto-draw error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function calculateNextDraw(frequency: string): string {
  const now = new Date();
  
  if (frequency === '5mins') {
    // Next 30-minute mark (20 times per day - every 1.2 hours)
    now.setMinutes(now.getMinutes() + 72, 0, 0); // 1 hour 12 minutes
  } else if (frequency === '30mins') {
    // Every 2.4 hours (10 times per day)
    now.setHours(now.getHours() + 2);
    now.setMinutes(now.getMinutes() + 24, 0, 0);
  } else if (frequency === '1hour') {
    // Every 4 hours (6 times per day)
    now.setHours(now.getHours() + 4, 0, 0, 0);
  } else if (frequency === '12hours') {
    now.setHours(18, 0, 0, 0); // 6pm
    if (now.getTime() <= Date.now()) {
      now.setDate(now.getDate() + 1);
    }
  } else if (frequency === '24hours') {
    now.setHours(24, 0, 0, 0); // Midnight
    if (now.getTime() <= Date.now()) {
      now.setDate(now.getDate() + 1);
    }
  }
  
  return now.toISOString();
}
