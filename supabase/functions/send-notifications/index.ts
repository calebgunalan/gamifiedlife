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

    const currentHour = new Date().getHours()
    const notificationsSent = []

    // Get users who have notifications enabled
    const { data: preferences, error: prefError } = await supabaseClient
      .from('notification_preferences')
      .select('user_id, daily_reminder_time, streak_reminder, quest_reminder')
      .eq('daily_reminder', true)

    if (prefError) throw prefError

    // Check streaks that might break today
    const { data: streaks, error: streakError } = await supabaseClient
      .from('streaks')
      .select('user_id, area, current_count, last_activity_date')
      .gte('current_count', 3)
      .neq('last_activity_date', new Date().toISOString().split('T')[0])

    if (streakError) throw streakError

    // Send streak protection reminders
    for (const streak of streaks || []) {
      const userPref = preferences?.find(p => p.user_id === streak.user_id)
      if (userPref?.streak_reminder) {
        // In production, integrate with email service (e.g., Resend, SendGrid)
        console.log(`Sending streak reminder to user ${streak.user_id} for ${streak.area}`)
        notificationsSent.push({
          user_id: streak.user_id,
          type: 'streak_reminder',
          area: streak.area,
          count: streak.current_count
        })
      }
    }

    // Check incomplete daily quests
    const { data: incompleteQuests, error: questError } = await supabaseClient
      .from('quests')
      .select('user_id, title')
      .eq('is_completed', false)
      .eq('quest_type', 'daily')
      .gte('due_date', new Date().toISOString().split('T')[0])

    if (questError) throw questError

    // Send quest reminders
    for (const quest of incompleteQuests || []) {
      const userPref = preferences?.find(p => p.user_id === quest.user_id)
      if (userPref?.quest_reminder) {
        console.log(`Sending quest reminder to user ${quest.user_id}`)
        notificationsSent.push({
          user_id: quest.user_id,
          type: 'quest_reminder',
          quest: quest.title
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notificationsSent.length,
        notifications: notificationsSent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-notifications:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})