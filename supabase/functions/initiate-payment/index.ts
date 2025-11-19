import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  email: string;
  provider: 'paystack' | 'remita' | 'flutterwave';
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

    // Sanitize and validate keys
    const publicKey = String(settings.public_key || '').trim();
    const secretKey = String(settings.secret_key || '').trim();
    
    // Validate keys based on provider
    if (provider === 'paystack') {
      const pkOk = /^pk_(test|live)_[a-zA-Z0-9]+$/.test(publicKey);
      const skOk = /^sk_(test|live)_[a-zA-Z0-9]+$/.test(secretKey);
      
      if (!pkOk || !skOk) {
        console.error('Invalid Paystack key format');
        throw new Error('Payment gateway key format is invalid. Please update keys in the admin panel.');
      }
      console.log('Using Paystack keys');
    } else if (provider === 'flutterwave') {
      if (!publicKey.startsWith('FLWPUBK-') || !secretKey.startsWith('FLWSECK-')) {
        console.error('Invalid Flutterwave key format');
        throw new Error('Payment gateway key format is invalid. Please update keys in the admin panel.');
      }
      console.log('Using Flutterwave keys');
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
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          amount: amount * 100, // Paystack expects amount in kobo
          reference: reference,
          callback_url: `https://luckywin.name.ng/payment/callback`,
          metadata: {
            user_id: user.id,
            transaction_id: transaction.id,
          }
        })
      });

      const paystackData = await paystackResponse.json();
      
      console.log('Paystack response:', paystackData);
      
      if (!paystackData.status) {
        // Extract detailed error message from Paystack
        const errorMessage = paystackData.message || 'Failed to initialize Paystack payment';
        console.error('Paystack error:', errorMessage);
        throw new Error(errorMessage);
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
      
    } else if (provider === 'flutterwave') {
      // Flutterwave payment initialization using v3 API
      const flutterwaveResponse = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tx_ref: reference,
          amount: amount,
          currency: 'NGN',
          redirect_url: `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}/payment/callback`,
          payment_options: 'card,banktransfer,ussd',
          customer: {
            email: email,
            name: email.split('@')[0],
          },
          customizations: {
            title: 'Wallet Deposit',
            description: 'Add funds to your wallet',
            logo: ''
          },
          meta: {
            user_id: user.id,
            transaction_id: transaction.id,
          }
        })
      });

      const flutterwaveData = await flutterwaveResponse.json();
      
      console.log('Flutterwave v3 response:', flutterwaveData);
      
      if (flutterwaveData.status !== 'success') {
        const errorMessage = flutterwaveData.message || 'Failed to initialize Flutterwave payment';
        console.error('Flutterwave error:', errorMessage);
        throw new Error(errorMessage);
      }

      paymentUrl = flutterwaveData.data.link;
      reference = flutterwaveData.data.tx_ref;
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
