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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { jackpotId, quantity = 1 } = await req.json();

    console.log('Purchasing tickets:', { jackpotId, quantity, userId: user.id });

    // Get jackpot details
    const { data: jackpot, error: jackpotError } = await supabase
      .from('jackpots')
      .select('*')
      .eq('id', jackpotId)
      .eq('status', 'active')
      .single();

    if (jackpotError || !jackpot) {
      throw new Error('Jackpot not found or not active');
    }

    const totalCost = Number(jackpot.ticket_price) * quantity;

    // Get user wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error('Wallet not found');
    }

    if (Number(wallet.balance) < totalCost) {
      throw new Error('Insufficient balance');
    }

    // Get the jackpot number
    const jackpotNumber = jackpot.jackpot_number || 1;
    
    // Get the starting sequence number
    const { data: startSeqData, error: startSeqError } = await supabase
      .rpc('get_next_ticket_sequence', { p_jackpot_id: jackpotId });
    
    if (startSeqError) throw startSeqError;
    
    const startSequence = startSeqData;
    
    // Generate ticket numbers with sequential format
    const tickets = [];
    for (let i = 0; i < quantity; i++) {
      const ticketSequence = startSequence + i;
      const ticketNumber = `${String(ticketSequence).padStart(3, '0')}-${String(jackpotNumber).padStart(3, '0')}`;
      
      tickets.push({
        user_id: user.id,
        jackpot_id: jackpotId,
        ticket_number: ticketNumber,
        purchase_price: jackpot.ticket_price,
        ticket_sequence: ticketSequence
      });
    }

    // Insert tickets
    const { data: insertedTickets, error: ticketsError } = await supabase
      .from('tickets')
      .insert(tickets)
      .select();

    if (ticketsError) throw ticketsError;

    // Deduct from wallet
    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({ balance: Number(wallet.balance) - totalCost })
      .eq('user_id', user.id);

    if (walletUpdateError) throw walletUpdateError;

    // Update jackpot prize pool
    const { error: jackpotUpdateError } = await supabase
      .from('jackpots')
      .update({ prize_pool: Number(jackpot.prize_pool) + totalCost })
      .eq('id', jackpotId);

    if (jackpotUpdateError) throw jackpotUpdateError;

    // Award XP for ticket purchase (1 XP per ticket)
    const { error: xpError } = await supabase.rpc('award_experience_points', {
      p_user_id: user.id,
      p_amount: quantity
    });

    if (xpError) console.error('Failed to award XP:', xpError);

    console.log('Tickets purchased successfully:', { count: quantity, totalCost, xpAwarded: quantity });

    return new Response(
      JSON.stringify({ 
        success: true, 
        tickets: insertedTickets,
        totalCost,
        remainingBalance: Number(wallet.balance) - totalCost
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Ticket purchase error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
