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

    console.log('Attempting to fetch banks...');

    // Try Paystack first
    const { data: paystackSettings, error: paystackError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('provider', 'paystack')
      .eq('is_enabled', true)
      .maybeSingle();

    if (!paystackError && paystackSettings?.secret_key) {
      console.log('Fetching banks from Paystack...');
      try {
        const response = await fetch('https://api.paystack.co/bank', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${paystackSettings.secret_key}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.status && data.data && data.data.length > 0) {
          console.log(`Successfully fetched ${data.data.length} banks from Paystack`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              banks: data.data,
              provider: 'paystack'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }
      } catch (paystackFetchError) {
        console.error('Paystack fetch failed:', paystackFetchError);
      }
    }

    // Try Flutterwave as fallback
    console.log('Trying Flutterwave as fallback...');
    const { data: flutterwaveSettings, error: flutterwaveError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('provider', 'flutterwave')
      .eq('is_enabled', true)
      .maybeSingle();

    if (!flutterwaveError && flutterwaveSettings?.secret_key) {
      console.log('Fetching banks from Flutterwave...');
      try {
        const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${flutterwaveSettings.secret_key}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        
        if (data.status === 'success' && data.data && data.data.length > 0) {
          console.log(`Successfully fetched ${data.data.length} banks from Flutterwave`);
          return new Response(
            JSON.stringify({ 
              success: true, 
              banks: data.data,
              provider: 'flutterwave'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }
      } catch (flutterwaveFetchError) {
        console.error('Flutterwave fetch failed:', flutterwaveFetchError);
      }
    }

    // No provider configured or both failed
    console.error('No payment provider configured with valid credentials');
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'No payment provider configured. Please configure Paystack or Flutterwave in admin settings.',
        banks: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error fetching banks:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        banks: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
