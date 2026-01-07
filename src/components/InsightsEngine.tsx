import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, TrendingUp, Calendar, Target, X } from "lucide-react";

interface Insight {
  id: string;
  type: "correlation" | "trend" | "suggestion" | "achievement";
  title: string;
  description: string;
  icon: "lightbulb" | "trending" | "calendar" | "target";
}

export function InsightsEngine() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const generatedInsights: Insight[] = [];

      // Fetch activity logs for analysis
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(200);

      // Fetch area progress
      const { data: areaProgress } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", user.id);

      // Fetch streaks
      const { data: streaks } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id);

      // Fetch spiritual logs for correlation
      const { data: spiritualLogs } = await supabase
        .from("spiritual_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (logs && logs.length > 0) {
        // Analyze day-of-week patterns
        const dayStats: Record<number, { count: number; xp: number }> = {};
        logs.forEach(log => {
          const day = new Date(log.completed_at).getDay();
          if (!dayStats[day]) dayStats[day] = { count: 0, xp: 0 };
          dayStats[day].count++;
          dayStats[day].xp += log.xp_earned;
        });

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const bestDay = Object.entries(dayStats).sort((a, b) => b[1].xp - a[1].xp)[0];
        if (bestDay) {
          generatedInsights.push({
            id: "best-day",
            type: "trend",
            title: `${days[parseInt(bestDay[0])]} is your best day!`,
            description: `You earn the most XP on ${days[parseInt(bestDay[0])]}s. Consider scheduling important tasks for this day.`,
            icon: "calendar"
          });
        }

        // Analyze area balance
        if (areaProgress && areaProgress.length >= 3) {
          const sortedAreas = [...areaProgress].sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0));
          const strongestArea = sortedAreas[0];
          const weakestArea = sortedAreas[sortedAreas.length - 1];

          if (strongestArea && weakestArea && strongestArea.weekly_xp > (weakestArea.weekly_xp || 0) * 3) {
            generatedInsights.push({
              id: "balance-suggestion",
              type: "suggestion",
              title: `Focus on ${weakestArea.area}`,
              description: `Your ${strongestArea.area} is thriving! Consider giving some attention to ${weakestArea.area} for better balance.`,
              icon: "target"
            });
          }
        }

        // Spiritual correlation insight
        if (spiritualLogs && spiritualLogs.length >= 5) {
          const spiritualDays = new Set(
            spiritualLogs.map(log => new Date(log.created_at).toDateString())
          );
          
          // Check if spiritual days correlate with higher productivity
          const spiritualDayLogs = logs.filter(log => 
            spiritualDays.has(new Date(log.completed_at).toDateString())
          );
          
          if (spiritualDayLogs.length > 5) {
            const avgXpOnSpiritualDays = spiritualDayLogs.reduce((sum, log) => sum + log.xp_earned, 0) / spiritualDayLogs.length;
            const avgXpOverall = logs.reduce((sum, log) => sum + log.xp_earned, 0) / logs.length;
            
            if (avgXpOnSpiritualDays > avgXpOverall * 1.2) {
              generatedInsights.push({
                id: "spiritual-correlation",
                type: "correlation",
                title: "Spiritual practice boosts productivity!",
                description: `On days you practice spirituality, you earn ${Math.round((avgXpOnSpiritualDays / avgXpOverall - 1) * 100)}% more XP on average.`,
                icon: "lightbulb"
              });
            }
          }
        }

        // Streak insights
        if (streaks && streaks.length > 0) {
          const longestStreak = streaks.reduce((max, streak) => 
            (streak.longest_count || 0) > (max.longest_count || 0) ? streak : max
          , streaks[0]);

          if (longestStreak && (longestStreak.longest_count || 0) >= 7) {
            generatedInsights.push({
              id: "streak-achievement",
              type: "achievement",
              title: `${longestStreak.longest_count}-day streak champion!`,
              description: `Your best streak in ${longestStreak.area} is ${longestStreak.longest_count} days. Can you beat it?`,
              icon: "trending"
            });
          }
        }

        // Weekly velocity insight
        const thisWeekLogs = logs.filter(log => {
          const logDate = new Date(log.completed_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return logDate > weekAgo;
        });

        const lastWeekLogs = logs.filter(log => {
          const logDate = new Date(log.completed_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const twoWeeksAgo = new Date();
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          return logDate > twoWeeksAgo && logDate <= weekAgo;
        });

        const thisWeekXP = thisWeekLogs.reduce((sum, log) => sum + log.xp_earned, 0);
        const lastWeekXP = lastWeekLogs.reduce((sum, log) => sum + log.xp_earned, 0);

        if (lastWeekXP > 0) {
          const change = ((thisWeekXP - lastWeekXP) / lastWeekXP) * 100;
          if (change > 20) {
            generatedInsights.push({
              id: "velocity-up",
              type: "trend",
              title: "You're on fire! 🔥",
              description: `You've earned ${Math.round(change)}% more XP this week compared to last week. Keep it up!`,
              icon: "trending"
            });
          } else if (change < -20) {
            generatedInsights.push({
              id: "velocity-down",
              type: "suggestion",
              title: "Let's pick up the pace",
              description: `Your XP is down ${Math.abs(Math.round(change))}% from last week. Try completing a quick quest to build momentum!`,
              icon: "target"
            });
          }
        }
      }

      // Limit to top 4 insights
      setInsights(generatedInsights.slice(0, 4));
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissInsight = (id: string) => {
    setDismissedInsights(prev => [...prev, id]);
  };

  const getIcon = (icon: string) => {
    switch (icon) {
      case "lightbulb": return <Lightbulb className="w-5 h-5" />;
      case "trending": return <TrendingUp className="w-5 h-5" />;
      case "calendar": return <Calendar className="w-5 h-5" />;
      case "target": return <Target className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "correlation": return "text-amethyst";
      case "trend": return "text-emerald";
      case "suggestion": return "text-gold";
      case "achievement": return "text-xp";
      default: return "text-primary";
    }
  };

  const visibleInsights = insights.filter(i => !dismissedInsights.includes(i.id));

  if (loading || visibleInsights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-gold" />
          Personal Insights
        </CardTitle>
        <CardDescription>
          Patterns and suggestions based on your activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {visibleInsights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 group"
            >
              <div className={`mt-0.5 ${getTypeColor(insight.type)}`}>
                {getIcon(insight.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                onClick={() => dismissInsight(insight.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
