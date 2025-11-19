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

    const payload = await req.json();

    console.log('Remita webhook received:', payload);

    // Remita sends statuscode: "00" or "01" for success
    if (payload.statuscode === "00" || payload.statuscode === "01") {
      const reference = payload.orderId;
      const amount = parseFloat(payload.amount);

      console.log('Processing successful payment:', { reference, amount });

      // Find transaction
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('reference', reference)
        .single();

      if (txError || !transaction) {
        console.error('Transaction not found:', reference);
        throw new Error('Transaction not found');
      }

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ 
          status: 'approved', 
          processed_at: new Date().toISOString()
        })
        .eq('id', transaction.id);

      // Update wallet balance
      await supabase.rpc('increment_wallet_balance', {
        p_user_id: transaction.user_id,
        p_amount: amount
      });

      console.log('Payment processed successfully:', { reference, amount });

      // Send notification
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: transaction.user_id,
          type: 'deposit_approved',
          amount: amount
        }
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
