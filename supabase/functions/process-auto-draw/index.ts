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

    console.log('Starting auto-draw process at:', new Date().toISOString());

    // Get all active jackpots that are due for a draw
    const now = new Date().toISOString();
    const { data: dueJackpots, error: jackpotsError } = await supabase
      .from('jackpots')
      .select('*')
      .eq('status', 'active')
      .lte('next_draw', now);

    if (jackpotsError) throw jackpotsError;

    if (!dueJackpots || dueJackpots.length === 0) {
      console.log('No jackpots due for draw');
      return new Response(
        JSON.stringify({ message: 'No jackpots due for draw' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const results = [];

    for (const jackpot of dueJackpots) {
      console.log('Processing draw for jackpot:', jackpot.name);

      // Get all tickets for this jackpot
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('jackpot_id', jackpot.id);

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        continue;
      }

      if (!tickets || tickets.length === 0) {
        console.log('No tickets for jackpot:', jackpot.name);
        
        // Calculate next draw time
        const nextDraw = calculateNextDraw(jackpot.frequency);
        await supabase
          .from('jackpots')
          .update({ next_draw: nextDraw })
          .eq('id', jackpot.id);
        
        continue;
      }

      // Select random winner
      const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];
      const prizeAmount = Number(jackpot.prize_pool);

      // Create draw record
      const { data: draw, error: drawError } = await supabase
        .from('draws')
        .insert({
          jackpot_id: jackpot.id,
          winning_ticket_id: winningTicket.id,
          prize_amount: prizeAmount,
          total_tickets: tickets.length
        })
        .select()
        .single();

      if (drawError) {
        console.error('Error creating draw:', drawError);
        continue;
      }

      // Create winner record
      const { error: winnerError } = await supabase
        .from('winners')
        .insert({
          draw_id: draw.id,
          user_id: winningTicket.user_id,
          ticket_id: winningTicket.id,
          jackpot_id: jackpot.id,
          prize_amount: prizeAmount
        });

      if (winnerError) {
        console.error('Error creating winner:', winnerError);
        continue;
      }

      // Update winner's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', winningTicket.user_id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({ balance: Number(wallet.balance) + prizeAmount })
          .eq('user_id', winningTicket.user_id);
      }

      // Send notification to winner
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: winningTicket.user_id,
          type: 'jackpot_win',
          amount: prizeAmount,
          jackpotName: jackpot.name
        }
      });

      // Calculate next draw time
      const nextDraw = calculateNextDraw(jackpot.frequency);

      // Reset jackpot
      await supabase
        .from('jackpots')
        .update({ 
          prize_pool: 0,
          next_draw: nextDraw
        })
        .eq('id', jackpot.id);

      results.push({
        jackpotName: jackpot.name,
        winner: winningTicket.user_id,
        prizeAmount: prizeAmount,
        totalTickets: tickets.length
      });

      console.log('Draw completed for:', jackpot.name, 'Winner:', winningTicket.user_id);
    }

    return new Response(
      JSON.stringify({ success: true, draws: results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Auto-draw error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function calculateNextDraw(frequency: string): string {
  const now = new Date();
  
  switch (frequency.toLowerCase()) {
    case 'hourly':
      now.setHours(now.getHours() + 1);
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
