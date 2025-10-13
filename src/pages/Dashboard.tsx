import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CharacterCard } from "@/components/CharacterCard";
import { SkillTree } from "@/components/SkillTree";
import { Button } from "@/components/ui/button";
import { Scroll, Plus, Award } from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  character_name: string;
  character_level: number;
  total_xp: number;
  monthly_xp: number;
}

interface AreaProgress {
  area: string;
  level: number;
  total_xp: number;
  weekly_xp: number;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [areaProgress, setAreaProgress] = useState<AreaProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: areasData } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("area");

      if (profileData) setProfile(profileData);
      if (areasData) setAreaProgress(areasData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextLevelXp = (level: number) => {
    return level * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-glow-pulse text-4xl mb-4">⚔️</div>
          <p className="text-muted-foreground">Loading your character...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No character data found</p>
      </div>
    );
  }

  const currentLevelXp = profile.monthly_xp % calculateNextLevelXp(profile.character_level);
  const nextLevelXp = calculateNextLevelXp(profile.character_level);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <span className="text-primary">⚔️</span>
            Full Gamified Life
          </h1>
          <div className="flex gap-2">
            <Link to="/quests">
              <Button variant="default" className="gap-2">
                <Scroll className="w-4 h-4" />
                Quests
              </Button>
            </Link>
            <Link to="/spiritual">
              <Button variant="secondary" className="gap-2">
                <span>🕉️</span>
                Spiritual
              </Button>
            </Link>
            <Link to="/achievements">
              <Button variant="secondary" className="gap-2">
                <Award className="w-4 h-4" />
                Achievements
              </Button>
            </Link>
          </div>
        </div>

        {/* Character Card */}
        <CharacterCard
          name={profile.character_name}
          level={profile.character_level}
          currentXp={currentLevelXp}
          nextLevelXp={nextLevelXp}
          totalXp={profile.total_xp}
        />

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Link to="/log-activity" className="flex-1">
            <Button className="w-full gap-2" size="lg">
              <Plus className="w-5 h-5" />
              Log Activity
            </Button>
          </Link>
        </div>

        {/* Skill Trees */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-primary">📊</span>
            Seven Life Dimensions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {areaProgress.map((area) => (
              <SkillTree
                key={area.area}
                area={area.area}
                level={area.level}
                currentXp={area.total_xp % calculateNextLevelXp(area.level)}
                nextLevelXp={calculateNextLevelXp(area.level)}
                weeklyXp={area.weekly_xp}
                weeklyTarget={50}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
