import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  email: string;
  provider: 'paystack' | 'remita';
}

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

    const { amount, email, provider }: PaymentRequest = await req.json();

    console.log('Initiating payment:', { amount, email, provider, userId: user.id });

    // Get payment settings
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('provider', provider)
      .eq('is_enabled', true)
      .single();

    if (settingsError || !settings) {
      throw new Error(`${provider} payment gateway is not configured or disabled`);
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        reference: `${provider}-${Date.now()}-${user.id.slice(0, 8)}`
      })
      .select()
      .single();

    if (txError) throw txError;

    let paymentUrl = '';
    let reference = transaction.reference;

    // Initialize payment based on provider
    if (provider === 'paystack') {
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.secret_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          amount: amount * 100, // Paystack expects amount in kobo
          reference: reference,
          callback_url: `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/dashboard`,
          metadata: {
            user_id: user.id,
            transaction_id: transaction.id,
          }
        })
      });

      const paystackData = await paystackResponse.json();
      
      if (!paystackData.status) {
        throw new Error(paystackData.message || 'Failed to initialize Paystack payment');
      }

      paymentUrl = paystackData.data.authorization_url;
      reference = paystackData.data.reference;

    } else if (provider === 'remita') {
      // Remita payment initialization
      const remitaResponse = await fetch('https://remitademo.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `remitaConsumerKey=${settings.public_key},remitaConsumerToken=${settings.api_key}`
        },
        body: JSON.stringify({
          serviceTypeId: settings.merchant_id,
          amount: amount,
          orderId: reference,
          payerName: email.split('@')[0],
          payerEmail: email,
          payerPhone: '',
          description: 'Wallet deposit'
        })
      });

      const remitaData = await remitaResponse.json();
      
      if (remitaData.statuscode !== '025') {
        throw new Error(remitaData.statusMessage || 'Failed to initialize Remita payment');
      }

      paymentUrl = `https://remitademo.net/remita/ecomm/${settings.public_key}/${remitaData.RRR}/${remitaData.orderId}/reset.reg`;
      reference = remitaData.RRR;
    }

    // Update transaction with payment reference
    await supabase
      .from('transactions')
      .update({ reference: reference })
      .eq('id', transaction.id);

    console.log('Payment initialized successfully:', { reference, paymentUrl });

    return new Response(
      JSON.stringify({ 
        success: true, 
        paymentUrl,
        reference,
        transactionId: transaction.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
