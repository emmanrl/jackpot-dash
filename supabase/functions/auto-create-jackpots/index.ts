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

    console.log('Auto-creating jackpots...');

    const now = new Date();
    const jackpotsToCreate = [];

    // Get the next jackpot number
    const { data: maxJackpot } = await supabase
      .from('jackpots')
      .select('jackpot_number')
      .order('jackpot_number', { ascending: false })
      .limit(1)
      .single();

    let nextJackpotNumber = (maxJackpot?.jackpot_number || 0) + 1;

    // 5-minute jackpot (runs every 30 minutes)
    const { data: existing5min } = await supabase
      .from('jackpots')
      .select('id')
      .eq('frequency', '5mins')
      .eq('status', 'active')
      .maybeSingle();

    if (!existing5min) {
      const nextDraw5min = new Date(now);
      nextDraw5min.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
      if (nextDraw5min <= now) nextDraw5min.setMinutes(nextDraw5min.getMinutes() + 30);

      jackpotsToCreate.push({
        name: '⚡ Quick Win - 5 Minutes',
        description: 'Fast jackpot every 30 minutes!',
        frequency: '5mins',
        ticket_price: 50.00,
        prize_pool: 0,
        next_draw: nextDraw5min.toISOString(),
        status: 'active',
        jackpot_number: nextJackpotNumber++
      });
    }

    // 12-hour jackpot (6am to 6pm)
    const { data: existing12h } = await supabase
      .from('jackpots')
      .select('id')
      .eq('frequency', '12hours')
      .eq('status', 'active')
      .maybeSingle();

    if (!existing12h) {
      const nextDraw12h = new Date(now);
      nextDraw12h.setHours(18, 0, 0, 0); // 6pm
      if (nextDraw12h <= now) {
        nextDraw12h.setDate(nextDraw12h.getDate() + 1);
      }

      jackpotsToCreate.push({
        name: '🌞 Daytime Jackpot - 12 Hours',
        description: 'Daily draw from 6am to 6pm',
        frequency: '12hours',
        ticket_price: 200.00,
        prize_pool: 0,
        next_draw: nextDraw12h.toISOString(),
        status: 'active',
        jackpot_number: nextJackpotNumber++
      });
    }

    // 24-hour jackpot (midnight to midnight)
    const { data: existing24h } = await supabase
      .from('jackpots')
      .select('id')
      .eq('frequency', '24hours')
      .eq('status', 'active')
      .maybeSingle();

    if (!existing24h) {
      const nextDraw24h = new Date(now);
      nextDraw24h.setHours(24, 0, 0, 0); // Next midnight
      if (nextDraw24h <= now) {
        nextDraw24h.setDate(nextDraw24h.getDate() + 1);
      }

      jackpotsToCreate.push({
        name: '🌙 Mega Jackpot - 24 Hours',
        description: 'Daily midnight draw with bigger prizes',
        frequency: '24hours',
        ticket_price: 500.00,
        prize_pool: 0,
        next_draw: nextDraw24h.toISOString(),
        status: 'active',
        jackpot_number: nextJackpotNumber++
      });
    }

    if (jackpotsToCreate.length > 0) {
      const { error } = await supabase
        .from('jackpots')
        .insert(jackpotsToCreate);

      if (error) throw error;
      console.log(`Created ${jackpotsToCreate.length} auto jackpots`);
    } else {
      console.log('All auto jackpots already exist');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        created: jackpotsToCreate.length,
        message: `Created ${jackpotsToCreate.length} jackpots`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Auto-create jackpots error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
