import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, TrendingUp, Flame } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";

const areaInfo: Record<string, { title: string; icon: string; color: string }> = {
  physical: { title: "Physical Health", icon: "💪", color: "health" },
  mental: { title: "Mental Development", icon: "🧠", color: "mind" },
  productivity: { title: "Productivity", icon: "⚡", color: "productivity" },
  social: { title: "Social", icon: "👥", color: "social" },
  financial: { title: "Financial", icon: "💰", color: "wealth" },
  personal: { title: "Personal Growth", icon: "🌟", color: "growth" },
  spiritual: { title: "Spiritual", icon: "✨", color: "spirit" }
};

export default function AreaDetail() {
  const { area } = useParams<{ area: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [areaProgress, setAreaProgress] = useState<any>(null);
  const [predefinedActivities, setPredefinedActivities] = useState<any[]>([]);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);

  useEffect(() => {
    loadAreaData();
  }, [area]);

  const loadAreaData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load area progress
      const { data: progress } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("area", area as any)
        .single();
      setAreaProgress(progress);

      // Load predefined activities
      const { data: predefined } = await supabase
        .from("predefined_activities")
        .select("*")
        .eq("area", area as any)
        .order("xp_value", { ascending: false });
      setPredefinedActivities(predefined || []);

      // Load user's custom activities
      const { data: custom } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id)
        .eq("area", area as any)
        .order("created_at", { ascending: false });
      setUserActivities(custom || []);

      // Load recent activity logs
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*, activities(name)")
        .eq("user_id", user.id)
        .eq("area", area as any)
        .order("completed_at", { ascending: false })
        .limit(10);
      setRecentLogs(logs || []);

      // Load streak
      const { data: streakData } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id)
        .eq("area", area as any)
        .single();
      setStreak(streakData);

    } catch (error) {
      console.error("Error loading area data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logPredefinedActivity = async (activity: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Log the activity
      const { error } = await supabase.from("activity_logs").insert({
        user_id: user.id,
        activity_id: activity.id,
        area: area,
        xp_earned: activity.xp_value,
        notes: `Completed: ${activity.name}`
      } as any);

      if (error) throw error;

      // Update area progress
      const newTotalXp = (areaProgress?.total_xp || 0) + activity.xp_value;
      const newWeeklyXp = (areaProgress?.weekly_xp || 0) + activity.xp_value;
      const newLevel = Math.floor(newTotalXp / 100) + 1;

      await supabase.from("area_progress").update({
        total_xp: newTotalXp,
        weekly_xp: newWeeklyXp,
        level: newLevel
      }).eq("user_id", user.id).eq("area", area as any);

      // Update profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp, character_level")
        .eq("id", user.id)
        .single();

      const profileTotalXp = (profile?.total_xp || 0) + activity.xp_value;
      const profileLevel = Math.floor(profileTotalXp / 1000) + 1;

      await supabase.from("profiles").update({
        total_xp: profileTotalXp,
        character_level: profileLevel
      }).eq("id", user.id);

      toast({
        title: `+${activity.xp_value} XP! 🎉`,
        description: `Completed: ${activity.name}`
      });

      loadAreaData();
    } catch (error) {
      console.error("Error logging activity:", error);
      toast({
        title: "Error",
        description: "Failed to log activity",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!area || !areaInfo[area]) {
    return <div className="p-8">Area not found</div>;
  }

  const info = areaInfo[area];
  const xpToNextLevel = ((areaProgress?.level || 1) * 100) - (areaProgress?.total_xp || 0);
  const progressPercent = ((areaProgress?.total_xp || 0) % 100);

  return (
    <div className="min-h-screen bg-background p-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Area Header */}
        <Card className="border-primary/30 bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-6xl">{info.icon}</span>
                <div>
                  <CardTitle className="text-3xl">{info.title}</CardTitle>
                  <CardDescription className="text-lg mt-1">
                    Level {areaProgress?.level || 1} • {areaProgress?.total_xp || 0} Total XP
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-destructive" />
                  <span className="text-2xl font-bold">{streak?.current_count || 0}</span>
                  <span className="text-muted-foreground">day streak</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    ❄️ {streak?.freeze_count || 0} freezes
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={(streak?.freeze_count || 0) === 0}
                    onClick={async () => {
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user || !streak) return;
                      
                      await supabase
                        .from("streaks")
                        .update({ freeze_count: streak.freeze_count - 1 })
                        .eq("id", streak.id);
                      
                      toast({
                        title: "Streak Frozen! ❄️",
                        description: "Your streak is protected for today."
                      });
                      loadAreaData();
                    }}
                  >
                    Use Freeze
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{progressPercent}%</span>
                <span>{xpToNextLevel} XP to Level {(areaProgress?.level || 1) + 1}</span>
              </div>
              <ProgressBar current={progressPercent} max={100} color={info.color as any} />
            </div>
          </CardHeader>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Weekly XP</CardTitle>
              <div className="text-3xl font-bold text-primary">
                {areaProgress?.weekly_xp || 0}
              </div>
              <CardDescription>Target: 60 XP/week</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activities Completed</CardTitle>
              <div className="text-3xl font-bold text-primary">
                {recentLogs.length}
              </div>
              <CardDescription>Last 10 activities</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Longest Streak</CardTitle>
              <div className="text-3xl font-bold text-destructive">
                {streak?.longest_count || 0}
              </div>
              <CardDescription>days in a row</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Predefined Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Activities</CardTitle>
            <CardDescription>Quick actions to earn XP in this area</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {predefinedActivities.map((activity) => (
                <Card key={activity.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{activity.icon}</span>
                          <h4 className="font-semibold">{activity.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">+{activity.xp_value} XP</Badge>
                          <Badge variant="secondary">{activity.frequency}</Badge>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => logPredefinedActivity(activity)}
                      >
                        Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Activities */}
        {userActivities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Custom Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{activity.name}</h4>
                      <Badge variant="outline" className="mt-1">
                        +{activity.xp_value} XP
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No activities logged yet. Complete an activity above to get started!
              </p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => (
                  <div 
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{log.activities?.name || log.notes}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(log.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>+{log.xp_earned} XP</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
