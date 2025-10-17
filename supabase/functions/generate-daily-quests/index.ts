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

    const today = new Date().toISOString().split('T')[0]
    
    // Get all quest templates
    const { data: templates, error: templateError } = await supabaseClient
      .from('quest_templates')
      .select('*')
      .eq('active', true)

    if (templateError) throw templateError

    // Get all users
    const { data: users, error: userError } = await supabaseClient
      .from('profiles')
      .select('id')

    if (userError) throw userError

    const questsCreated = []

    // Generate daily quests for each user
    for (const user of users || []) {
      // Check if user already has quests for today
      const { data: existingQuests } = await supabaseClient
        .from('quests')
        .select('id')
        .eq('user_id', user.id)
        .gte('due_date', today)
        .eq('quest_type', 'daily')

      if (existingQuests && existingQuests.length > 0) {
        continue // User already has quests for today
      }

      // Select 5 random daily templates
      const dailyTemplates = templates?.filter(t => t.quest_type === 'daily') || []
      const selectedTemplates = dailyTemplates
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)

      // Create quests from templates
      for (const template of selectedTemplates) {
        const { error: insertError } = await supabaseClient
          .from('quests')
          .insert({
            user_id: user.id,
            title: template.title,
            description: template.description,
            quest_type: 'daily',
            area: template.area,
            xp_reward: template.xp_reward,
            due_date: today,
            is_completed: false
          })

        if (!insertError) {
          questsCreated.push({
            user_id: user.id,
            title: template.title
          })
        }
      }
    }

    // Generate weekly quests on Mondays
    const dayOfWeek = new Date().getDay()
    if (dayOfWeek === 1) { // Monday
      for (const user of users || []) {
        const weeklyTemplates = templates?.filter(t => t.quest_type === 'weekly') || []
        const selectedWeekly = weeklyTemplates
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)

        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() + 7)

        for (const template of selectedWeekly) {
          await supabaseClient
            .from('quests')
            .insert({
              user_id: user.id,
              title: template.title,
              description: template.description,
              quest_type: 'weekly',
              area: template.area,
              xp_reward: template.xp_reward,
              due_date: weekEnd.toISOString().split('T')[0],
              is_completed: false
            })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        questsCreated: questsCreated.length,
        message: `Generated quests for ${users?.length || 0} users`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-daily-quests:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})