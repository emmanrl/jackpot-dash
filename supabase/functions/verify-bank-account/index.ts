import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  accountNumber: string;
  bankCode: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { accountNumber, bankCode } = await req.json() as VerificationRequest;

    console.log('Verifying bank account:', { accountNumber, bankCode });

    // Get Paystack settings
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('provider', 'paystack')
      .eq('is_enabled', true)
      .single();

    if (settingsError || !settings || !settings.secret_key) {
      throw new Error('Paystack is not configured or enabled');
    }

    // Verify account using Paystack Account Resolution API
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.secret_key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (!data.status) {
      throw new Error(data.message || 'Account verification failed');
    }

    console.log('Account verified:', data.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        accountName: data.data.account_name,
        accountNumber: data.data.account_number
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Account verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
