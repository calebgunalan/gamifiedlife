import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Quest {
  id: string;
  title: string;
  description: string;
  area: string;
  xp_reward: number;
  difficulty: string;
  reason: string;
}

const areaIcons: Record<string, string> = {
  physical: "💪",
  mental: "🧠",
  productivity: "⚡",
  social: "👥",
  financial: "💰",
  personal: "🌟",
  spiritual: "✨"
};

export function SmartQuests() {
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's area progress to find lagging areas
      const { data: areaProgress } = await supabase
        .from("area_progress")
        .select("area, weekly_xp, level")
        .eq("user_id", user.id);

      // Get user's streaks to find areas at risk
      const { data: streaks } = await supabase
        .from("streaks")
        .select("area, current_count, last_activity_date")
        .eq("user_id", user.id);

      // Get active quest templates
      const { data: templates } = await supabase
        .from("quest_templates")
        .select("*")
        .eq("is_active", true)
        .eq("quest_type", "daily");

      // Get user's already accepted quests for today
      const today = new Date().toISOString().split('T')[0];
      const { data: acceptedQuests } = await supabase
        .from("quests")
        .select("title")
        .eq("user_id", user.id)
        .gte("created_at", today);

      const acceptedTitles = new Set(acceptedQuests?.map(q => q.title) || []);

      // Build priority scores for each area
      const areaScores: Record<string, { score: number; reason: string }> = {};
      const targetWeeklyXp = 60;

      areaProgress?.forEach(area => {
        let score = 0;
        let reason = "";

        // Lower weekly XP = higher priority
        const weeklyDeficit = targetWeeklyXp - (area.weekly_xp || 0);
        if (weeklyDeficit > 0) {
          score += weeklyDeficit / 10;
          reason = `Need ${weeklyDeficit} more XP this week`;
        }

        // Check streak status
        const streak = streaks?.find(s => s.area === area.area);
        if (streak) {
          const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date) : null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (lastActivity) {
            const daysSinceActivity = Math.floor((today.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceActivity >= 1) {
              score += 5;
              reason = `${streak.current_count || 0} day streak at risk!`;
            }
          }
        }

        areaScores[area.area] = { score, reason };
      });

      // Score and rank quests
      const scoredQuests = templates
        ?.filter(t => !acceptedTitles.has(t.title))
        .map(template => {
          const areaData = areaScores[template.area] || { score: 0, reason: "Explore new area" };
          return {
            id: template.id,
            title: template.title,
            description: template.description || "",
            area: template.area,
            xp_reward: template.xp_reward,
            difficulty: template.difficulty,
            reason: areaData.reason || "Build your character",
            priority: areaData.score + (template.difficulty === "easy" ? 2 : template.difficulty === "medium" ? 1 : 0)
          };
        })
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5) || [];

      setQuests(scoredQuests);
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptQuest = async (quest: Quest) => {
    try {
      setAccepting(quest.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { error } = await supabase.from("quests").insert({
        user_id: user.id,
        title: quest.title,
        description: quest.description,
        area: quest.area as any,
        xp_reward: quest.xp_reward,
        quest_type: "daily",
        due_date: dueDate,
        is_completed: false
      });

      if (error) throw error;

      toast({
        title: "Quest Accepted! ⚔️",
        description: quest.title
      });

      // Remove from list
      setQuests(prev => prev.filter(q => q.id !== quest.id));
    } catch (error) {
      console.error("Error accepting quest:", error);
      toast({
        title: "Error",
        description: "Failed to accept quest",
        variant: "destructive"
      });
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>Finding your perfect quests...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quests.length === 0) {
    return (
      <Card className="border-primary/30">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Check className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
          <p>All caught up! Check back later for new quests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Recommended For You
        </CardTitle>
        <CardDescription>Personalized quests based on your goals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {quests.map(quest => (
          <div 
            key={quest.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start gap-3 flex-1">
              <span className="text-2xl">{areaIcons[quest.area] || "⚔️"}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{quest.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    +{quest.xp_reward} XP
                  </Badge>
                  {quest.reason.includes("risk") && (
                    <span className="text-xs text-amber-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {quest.reason}
                    </span>
                  )}
                  {!quest.reason.includes("risk") && (
                    <span className="text-xs text-muted-foreground">
                      {quest.reason}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={() => acceptQuest(quest)}
              disabled={accepting === quest.id}
            >
              {accepting === quest.id ? "..." : "Accept"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}