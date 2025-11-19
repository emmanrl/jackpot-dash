import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get jackpots that will draw in 30 minutes
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000)
    const twentyNineMinutesFromNow = new Date(Date.now() + 29 * 60 * 1000)

    const { data: upcomingJackpots, error: jackpotsError } = await supabaseClient
      .from('jackpots')
      .select('id, name, next_draw')
      .eq('status', 'active')
      .gte('next_draw', twentyNineMinutesFromNow.toISOString())
      .lte('next_draw', thirtyMinutesFromNow.toISOString())

    if (jackpotsError) throw jackpotsError

    if (!upcomingJackpots || upcomingJackpots.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No upcoming draws found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // For each upcoming jackpot, get users who have favorited it
    for (const jackpot of upcomingJackpots) {
      const { data: favorites, error: favoritesError } = await supabaseClient
        .from('favorite_jackpots')
        .select('user_id')
        .eq('jackpot_id', jackpot.id)

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError)
        continue
      }

      // Send notification to each user
      for (const favorite of favorites || []) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: favorite.user_id,
            type: 'favorite_draw',
            title: '🎯 Draw Alert!',
            message: `Your favorited jackpot "${jackpot.name}" will draw in 30 minutes! Don't miss out!`,
            data: { jackpot_id: jackpot.id, jackpot_name: jackpot.name }
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent',
        jackpots: upcomingJackpots.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
