import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CharacterCard } from "@/components/CharacterCard";
import { SkillTree } from "@/components/SkillTree";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scroll, Award, Heart, Users, BarChart3, User, Target, Swords, Trophy, MessageSquare, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { NotificationCenter } from "@/components/NotificationCenter";
import { useDailyLogin } from "@/hooks/useDailyLogin";
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const dailyLogin = useDailyLogin();

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

      // Check if user has completed onboarding
      const { data: onboarding } = await supabase
        .from("user_onboarding" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!onboarding) {
        setShowOnboarding(true);
      }

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
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <span className="text-primary">⚔️</span>
            Full Gamified Life
          </h1>
          <div className="flex flex-wrap gap-2 items-center">
            <NotificationCenter />
            <Link to="/quests">
              <Button variant="default" size="sm" className="gap-2">
                <Scroll className="w-4 h-4" />
                Quests
              </Button>
            </Link>
            <Link to="/spiritual-hub">
              <Button variant="secondary" size="sm" className="gap-2">
                <Heart className="w-4 h-4" />
                Spiritual
              </Button>
            </Link>
            <Link to="/achievements">
              <Button variant="secondary" size="sm" className="gap-2">
                <Award className="w-4 h-4" />
                Achievements
              </Button>
            </Link>
            <Link to="/parties">
              <Button variant="secondary" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Parties
              </Button>
            </Link>
            <Link to="/insights">
              <Button variant="secondary" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Insights
              </Button>
            </Link>
            <Link to="/friends">
              <Button variant="secondary" size="sm" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Friends
              </Button>
            </Link>
            <Link to="/social">
              <Button variant="secondary" size="sm" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Feed
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="secondary" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                Profile
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

        {/* Weekly Balance Card */}
        <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Weekly Balance
            </CardTitle>
            <CardDescription>
              Hit 60+ XP in 5+ areas to become a Balance Master this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {areaProgress.map((area: any) => {
                const metTarget = area.weekly_xp >= 60;
                return (
                  <div key={area.area} className="text-center">
                    <div 
                      className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                        metTarget ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                      }`}
                    >
                      {metTarget ? '✓' : area.weekly_xp}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{area.area}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                {areaProgress.filter((a: any) => a.weekly_xp >= 60).length} / 7 areas on track
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Link to="/log-activity">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <Scroll className="w-6 h-6" />
              <span>Log Activity</span>
            </Button>
          </Link>
          <Link to="/challenges">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <Swords className="w-6 h-6" />
              <span>Challenges</span>
            </Button>
          </Link>
          <Link to="/leaderboards">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <Trophy className="w-6 h-6" />
              <span>Leaderboards</span>
            </Button>
          </Link>
          <Link to="/insights">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <BarChart3 className="w-6 h-6" />
              <span>Insights</span>
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" className="h-24 w-full flex-col gap-2">
              <User className="w-6 h-6" />
              <span>Profile</span>
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
              <Link key={area.area} to={`/area/${area.area}`}>
                <SkillTree
                  area={area.area}
                  level={area.level}
                  currentXp={area.total_xp % calculateNextLevelXp(area.level)}
                  nextLevelXp={calculateNextLevelXp(area.level)}
                  weeklyXp={area.weekly_xp}
                  weeklyTarget={50}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
