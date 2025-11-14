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

    const { reference, provider } = await req.json();

    console.log('Verifying payment:', { reference, provider });

    // Get payment settings
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('provider', provider)
      .single();

    if (settingsError || !settings) {
      throw new Error(`Payment settings not found for ${provider}`);
    }

    let paymentVerified = false;
    let amount = 0;

    // Verify payment based on provider
    if (provider === 'paystack') {
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.secret_key}`,
        }
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.status && verifyData.data.status === 'success') {
        paymentVerified = true;
        amount = verifyData.data.amount / 100; // Convert from kobo to naira
      }

    } else if (provider === 'remita') {
      const verifyResponse = await fetch(`https://remitademo.net/remita/ecomm/${settings.merchant_id}/${reference}/${settings.api_key}/status.reg`, {
        method: 'GET',
        headers: {
          'Authorization': `remitaConsumerKey=${settings.public_key},remitaConsumerToken=${settings.api_key}`
        }
      });

      const verifyData = await verifyResponse.text();
      
      if (verifyData.includes('00') || verifyData.includes('01')) {
        paymentVerified = true;
        // Parse amount from response
        const amountMatch = verifyData.match(/amount=([0-9.]+)/);
        amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      }
      
    } else if (provider === 'flutterwave') {
      const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${reference}/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.secret_key}`,
        }
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.status === 'success' && verifyData.data.status === 'successful') {
        paymentVerified = true;
        amount = verifyData.data.amount;
      }
    }

    if (!paymentVerified) {
      throw new Error('Payment verification failed');
    }

    // Get transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .single();

    if (txError || !transaction) {
      throw new Error('Transaction not found');
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'approved', processed_at: new Date().toISOString() })
      .eq('id', transaction.id);

    // Update wallet balance
    await supabase.rpc('increment_wallet_balance', {
      p_user_id: transaction.user_id,
      p_amount: amount
    });

    console.log('Payment verified and wallet updated:', { reference, amount });

    // Call email notification function
    await supabase.functions.invoke('send-notification', {
      body: {
        userId: transaction.user_id,
        type: 'deposit_approved',
        amount: amount
      }
    });

    return new Response(
      JSON.stringify({ success: true, amount }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
