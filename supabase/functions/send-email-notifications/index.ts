import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type } = await req.json();
    const emailsSent: string[] = [];
    const errors: string[] = [];

    if (type === 'streak_warning') {
      // Get users with streaks at risk
      const today = new Date().toISOString().split('T')[0];
      const { data: streaks, error: streakError } = await supabaseClient
        .from('streaks')
        .select('user_id, area, current_count, last_activity_date')
        .gte('current_count', 3)
        .neq('last_activity_date', today);

      if (streakError) {
        console.error('Error fetching streaks:', streakError);
        throw streakError;
      }

      // Group by user
      const userStreaks: Record<string, any[]> = {};
      for (const streak of streaks || []) {
        if (!userStreaks[streak.user_id]) {
          userStreaks[streak.user_id] = [];
        }
        userStreaks[streak.user_id].push(streak);
      }

      // Send emails to users with streak warning enabled
      for (const [userId, userStreakList] of Object.entries(userStreaks)) {
        try {
          // Check notification preferences
          const { data: prefs } = await supabaseClient
            .from('notification_preferences')
            .select('streak_warning_email, email_enabled')
            .eq('user_id', userId)
            .single();

          if (!prefs?.email_enabled || !prefs?.streak_warning_email) {
            continue;
          }

          // Get user email
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('email, character_name')
            .eq('id', userId)
            .single();

          if (!profile?.email) {
            continue;
          }

          const streakAreas = userStreakList.map(s => 
            `${s.area.charAt(0).toUpperCase() + s.area.slice(1)} (${s.current_count} days)`
          ).join(', ');

          const { error: emailError } = await resend.emails.send({
            from: 'Gamified Life <onboarding@resend.dev>',
            to: [profile.email],
            subject: '🔥 Your streaks need attention!',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #f59e0b;">⚠️ Streak Warning!</h1>
                <p>Hey ${profile.character_name || 'Adventurer'},</p>
                <p>Your streaks are at risk! You haven't logged activity today for:</p>
                <p style="background: #fef3c7; padding: 15px; border-radius: 8px; font-weight: bold;">
                  ${streakAreas}
                </p>
                <p>Don't let your hard work go to waste! Log an activity now to keep your streaks alive.</p>
                <p style="margin-top: 30px;">Keep pushing forward! 💪</p>
                <p style="color: #666;">— The Gamified Life Team</p>
              </div>
            `
          });

          if (emailError) {
            errors.push(`Failed to send to ${profile.email}: ${emailError.message}`);
          } else {
            emailsSent.push(profile.email);
          }
        } catch (err) {
          console.error(`Error processing user ${userId}:`, err);
          errors.push(`Error for user ${userId}`);
        }
      }
    } else if (type === 'weekly_summary') {
      // Get all users with weekly summary enabled
      const { data: prefs, error: prefsError } = await supabaseClient
        .from('notification_preferences')
        .select('user_id')
        .eq('email_enabled', true)
        .eq('weekly_summary_email', true);

      if (prefsError) throw prefsError;

      for (const pref of prefs || []) {
        try {
          // Get user profile and stats
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('email, character_name, character_level, total_xp')
            .eq('id', pref.user_id)
            .single();

          if (!profile?.email) continue;

          // Get weekly XP
          const { data: areaProgress } = await supabaseClient
            .from('area_progress')
            .select('area, weekly_xp, level')
            .eq('user_id', pref.user_id);

          const totalWeeklyXP = (areaProgress || []).reduce((sum, a) => sum + (a.weekly_xp || 0), 0);
          const areasOnTrack = (areaProgress || []).filter(a => (a.weekly_xp || 0) >= 60).length;

          // Get completed quests this week
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);
          
          const { count: completedQuests } = await supabaseClient
            .from('quests')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', pref.user_id)
            .eq('is_completed', true)
            .gte('completed_at', weekStart.toISOString());

          const areaList = (areaProgress || []).map(a => 
            `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-transform: capitalize;">${a.area}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${a.weekly_xp || 0} XP</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">Level ${a.level}</td>
            </tr>`
          ).join('');

          const { error: emailError } = await resend.emails.send({
            from: 'Gamified Life <onboarding@resend.dev>',
            to: [profile.email],
            subject: `📊 Your Weekly Summary - ${totalWeeklyXP} XP earned!`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #8b5cf6;">📊 Weekly Summary</h1>
                <p>Hey ${profile.character_name || 'Adventurer'},</p>
                <p>Here's how your week went:</p>
                
                <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
                  <h2 style="margin: 0 0 10px 0;">Week Highlights</h2>
                  <p style="margin: 5px 0;">⚡ <strong>${totalWeeklyXP} XP</strong> earned this week</p>
                  <p style="margin: 5px 0;">📋 <strong>${completedQuests || 0}</strong> quests completed</p>
                  <p style="margin: 5px 0;">🎯 <strong>${areasOnTrack}/7</strong> areas on track</p>
                  <p style="margin: 5px 0;">🏆 Current Level: <strong>${profile.character_level}</strong></p>
                </div>

                <h3>Progress by Area</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: #f3f4f6;">
                      <th style="padding: 10px; text-align: left;">Area</th>
                      <th style="padding: 10px; text-align: left;">Weekly XP</th>
                      <th style="padding: 10px; text-align: left;">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${areaList}
                  </tbody>
                </table>

                <p style="margin-top: 30px;">Keep up the amazing work! Every day is a new opportunity to level up. 🚀</p>
                <p style="color: #666;">— The Gamified Life Team</p>
              </div>
            `
          });

          if (emailError) {
            errors.push(`Failed to send summary to ${profile.email}`);
          } else {
            emailsSent.push(profile.email);
          }
        } catch (err) {
          console.error(`Error processing weekly summary for ${pref.user_id}:`, err);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: emailsSent.length,
        emails: emailsSent,
        errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-email-notifications:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
