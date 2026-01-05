import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Trophy } from "lucide-react";

interface FriendProfile {
  id: string;
  character_name: string;
  character_level: number;
  total_xp: number;
}

interface AreaProgress {
  area: string;
  level: number;
  total_xp: number;
  weekly_xp: number;
}

export default function FriendProgress() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [areaProgress, setAreaProgress] = useState<AreaProgress[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFriendData();
  }, [friendId]);

  const loadFriendData = async () => {
    if (!friendId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verify friendship
      const { data: friendship } = await supabase
        .from("friends")
        .select("*")
        .eq("status", "accepted")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .single();

      if (!friendship) {
        setError("You are not friends with this user.");
        setLoading(false);
        return;
      }

      // Load friend's profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", friendId)
        .single();

      // Load friend's area progress
      const { data: areasData } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", friendId);

      // Load friend's achievements
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", friendId);

      if (profileData) setProfile(profileData);
      if (areasData) setAreaProgress(areasData);
      if (achievementsData) setAchievements(achievementsData);
    } catch (err) {
      console.error("Error loading friend data:", err);
      setError("Failed to load friend's progress.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading friend's progress...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/friends")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Friends
        </Button>
        <div className="text-center py-12 text-muted-foreground">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/friends")}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Friends
      </Button>

      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="mb-6 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-4xl">
                ⚔️
              </div>
              <div>
                <h1 className="text-3xl font-bold">{profile?.character_name}</h1>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <span className="text-gold font-medium">
                    Level {profile?.character_level}
                  </span>
                  <span>•</span>
                  <span className="text-xp">{profile?.total_xp} Total XP</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Area Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Progress by Area</CardTitle>
            <CardDescription>
              Your friend's growth across all seven dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {areaProgress.map((area) => (
                <div key={area.area}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium capitalize">
                      {area.area.replace("_", " ")}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Level {area.level} • {area.total_xp} XP
                    </span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary transition-all"
                      style={{ 
                        width: `${Math.min((area.weekly_xp / 60) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {area.weekly_xp} / 60 weekly XP
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              Achievements
            </CardTitle>
            <CardDescription>
              {achievements.length} achievements earned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No achievements unlocked yet.
              </p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {achievements.map((ua) => (
                  <div 
                    key={ua.id}
                    className="text-center p-3 rounded-lg border border-gold/30 bg-card"
                  >
                    <div className="text-3xl mb-2">{ua.achievements?.icon}</div>
                    <div className="text-sm font-medium">{ua.achievements?.name}</div>
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
