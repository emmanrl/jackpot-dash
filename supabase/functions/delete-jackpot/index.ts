import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { jackpotId } = await req.json();
    console.log('Deleting jackpot:', jackpotId);

    // Get all tickets for this jackpot
    const { data: tickets, error: ticketsError } = await supabaseClient
      .from('tickets')
      .select('user_id, purchase_price')
      .eq('jackpot_id', jackpotId);

    if (ticketsError) throw ticketsError;

    console.log('Found tickets to refund:', tickets?.length);

    // Group tickets by user and calculate refunds
    const userRefunds = new Map<string, number>();
    
    tickets?.forEach(ticket => {
      const userId = ticket.user_id;
      const amount = Number(ticket.purchase_price);
      
      const current = userRefunds.get(userId) || 0;
      userRefunds.set(userId, current + amount);
    });

    // Process refunds for each user
    for (const [userId, totalRefund] of userRefunds) {
      console.log(`Refunding ${totalRefund} to user ${userId}`);
      
      // Update wallet balance using RPC function
      const { error: walletError } = await supabaseClient.rpc(
        'increment_wallet_balance',
        { p_user_id: userId, p_amount: totalRefund }
      );

      if (walletError) {
        console.error('Error updating wallet:', walletError);
        throw walletError;
      }

      // Create notification
      const { error: notifError } = await supabaseClient
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'refund',
          title: 'Jackpot Deleted - Refund Issued',
          message: `A jackpot has been cancelled and ₦${totalRefund.toFixed(2)} has been refunded to your wallet.`,
          data: { 
            jackpotId,
            amount: totalRefund 
          }
        });

      if (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

    // Delete the jackpot (cascade will handle related records)
    const { error: deleteError } = await supabaseClient
      .from('jackpots')
      .delete()
      .eq('id', jackpotId);

    if (deleteError) throw deleteError;

    console.log('Jackpot deleted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        refundedUsers: userRefunds.size,
        totalRefunded: Array.from(userRefunds.values()).reduce((sum, amount) => sum + amount, 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-jackpot function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});