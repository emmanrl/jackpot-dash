import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get webhook payload
    const payload = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    console.log('Received webhook from Paystack');

    // Get Paystack secret key for signature verification
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('secret_key')
      .eq('provider', 'paystack')
      .eq('is_enabled', true)
      .single();

    if (settingsError || !settings) {
      console.error('Paystack settings not found or not enabled');
      return new Response(
        JSON.stringify({ error: 'Payment provider not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify webhook signature
    const hash = await crypto.subtle.digest(
      "SHA-512",
      new TextEncoder().encode(settings.secret_key + payload)
    );
    const hashArray = Array.from(new Uint8Array(hash));
    const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (signature !== computedSignature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Parse event
    const event = JSON.parse(payload);
    console.log('Webhook event:', event.event);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, amount, status } = event.data;
      
      console.log('Processing successful charge:', { reference, amount, status });

      // Find transaction by reference
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('reference', reference)
        .single();

      if (txError || !transaction) {
        console.error('Transaction not found for reference:', reference);
        return new Response(
          JSON.stringify({ error: 'Transaction not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Skip if already processed
      if (transaction.status === 'approved') {
        console.log('Transaction already approved:', reference);
        return new Response(
          JSON.stringify({ success: true, message: 'Already processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ 
          status: 'approved', 
          processed_at: new Date().toISOString(),
          admin_note: 'Auto-approved via Paystack webhook'
        })
        .eq('id', transaction.id);

      // Update wallet balance (amount is in kobo, convert to naira)
      const amountInNaira = amount / 100;
      await supabase.rpc('increment_wallet_balance', {
        p_user_id: transaction.user_id,
        p_amount: amountInNaira
      });

      console.log('Transaction approved and wallet updated:', { reference, amount: amountInNaira });

      // Send notification
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: transaction.user_id,
          type: 'deposit_approved',
          amount: amountInNaira
        }
      });

      return new Response(
        JSON.stringify({ success: true, amount: amountInNaira }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Return success for other events
    return new Response(
      JSON.stringify({ success: true, message: 'Event received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
