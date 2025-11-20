import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BalanceRequest {
  provider: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { provider }: BalanceRequest = await req.json();

    if (!provider) {
      return new Response(
        JSON.stringify({ error: 'Provider is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch provider settings
    const { data: providerSettings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('provider', provider.toLowerCase())
      .eq('is_withdrawal_enabled', true)
      .single();

    if (settingsError || !providerSettings) {
      throw new Error(`Provider ${provider} not found or not enabled for withdrawals`);
    }

    let balance = 0;

    if (provider.toLowerCase() === 'paystack') {
      const response = await fetch('https://api.paystack.co/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${providerSettings.secret_key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Paystack balance');
      }

      const data = await response.json();
      // Paystack balance is in kobo, convert to naira
      balance = data.data[0].balance / 100;
    } else if (provider.toLowerCase() === 'flutterwave') {
      const response = await fetch('https://api.flutterwave.com/v3/balances/NGN', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${providerSettings.secret_key}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Flutterwave balance');
      }

      const data = await response.json();
      balance = data.data.available_balance;
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log(`${provider} balance:`, balance);

    return new Response(
      JSON.stringify({ balance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching provider balance:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
