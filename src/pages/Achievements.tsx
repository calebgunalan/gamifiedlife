import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Lock } from "lucide-react";

export default function Achievements() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all achievements
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      // Load user's unlocked achievements
      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);

      setAchievements(allAchievements || []);
      setUnlockedAchievements(
        new Set(userAchievements?.map(ua => ua.achievement_id) || [])
      );
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAreaColor = (area: string | null) => {
    if (!area) return "text-gold";
    const colors: Record<string, string> = {
      physical: "text-emerald",
      mental: "text-amethyst",
      productivity: "text-xp",
      social: "text-gold",
      financial: "text-gold",
      personal: "text-ruby",
      spiritual: "text-emerald"
    };
    return colors[area] || "text-gold";
  };

  if (loading) {
    return <div className="p-8">Loading achievements...</div>;
  }

  const unlockedCount = unlockedAchievements.size;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="min-h-screen bg-background p-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-gold" />
          <h1 className="text-4xl font-bold">Achievements</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              {unlockedCount} of {totalCount} achievements unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion</span>
                <span className="font-bold text-gold">{completionPercentage}%</span>
              </div>
              <div className="h-4 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => {
            const isUnlocked = unlockedAchievements.has(achievement.id);
            return (
              <Card 
                key={achievement.id}
                className={`transition-all duration-300 ${
                  isUnlocked 
                    ? "border-gold/50 hover:border-gold" 
                    : "opacity-60 hover:opacity-80"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{achievement.icon}</span>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {achievement.name}
                          {isUnlocked && (
                            <Trophy className="w-4 h-4 text-gold" />
                          )}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={getAreaColor(achievement.area)}
                        >
                          {achievement.area || "General"}
                        </Badge>
                      </div>
                    </div>
                    {!isUnlocked && (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Requirement: {achievement.requirement_type} - {achievement.requirement_value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}