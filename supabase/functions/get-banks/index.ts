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

    console.log('Fetching banks from Paystack...');

    // Get Paystack settings
    const { data: settings, error: settingsError } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('provider', 'paystack')
      .eq('is_enabled', true)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching payment settings:', settingsError);
      throw new Error('Failed to fetch payment settings');
    }

    if (!settings || !settings.secret_key) {
      console.error('Paystack not configured');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Paystack is not configured. Please configure Paystack in admin settings to enable bank selection.',
          banks: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Fetch banks from Paystack
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${settings.secret_key}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!data.status || !data.data) {
      throw new Error('Failed to fetch banks from Paystack');
    }

    console.log(`Successfully fetched ${data.data.length} banks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        banks: data.data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error fetching banks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
