import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all profiles that need monthly reset
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { data: profiles, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, monthly_xp, monthly_reset_date')
      .lt('monthly_reset_date', firstDayOfMonth.toISOString())

    if (fetchError) throw fetchError

    console.log(`Processing ${profiles?.length || 0} profiles for monthly reset`)

    // Reset monthly XP for each profile
    const resetPromises = profiles?.map(async (profile) => {
      return supabaseClient
        .from('profiles')
        .update({
          monthly_xp: 0,
          monthly_reset_date: firstDayOfMonth.toISOString()
        })
        .eq('id', profile.id)
    }) || []

    await Promise.all(resetPromises)

    // Also reset weekly XP in area_progress if it's Monday
    const today = new Date()
    if (today.getDay() === 1) { // Monday
      const { error: weeklyResetError } = await supabaseClient
        .from('area_progress')
        .update({ weekly_xp: 0 })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

      if (weeklyResetError) throw weeklyResetError
      console.log('Weekly XP reset completed')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset ${profiles?.length || 0} profiles`,
        resetDate: firstDayOfMonth.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in monthly-reset:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})