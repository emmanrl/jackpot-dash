import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
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
    const verifHash = req.headers.get('verif-hash');

    console.log('Flutterwave webhook received:', payload);

    // Verify webhook signature
    const { data: settings } = await supabase
      .from('payment_settings')
      .select('secret_key')
      .eq('provider', 'flutterwave')
      .single();

    if (!settings) {
      throw new Error('Flutterwave settings not found');
    }

    // Flutterwave sends secret key as verif-hash header
    if (verifHash !== settings.secret_key) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Process successful payment
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const reference = payload.data.tx_ref;
      const amount = payload.data.amount;

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
