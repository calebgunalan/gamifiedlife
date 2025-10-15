import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Flame, TrendingUp, Target } from "lucide-react";

export default function Leaderboards() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dailyXP, setDailyXP] = useState<any[]>([]);
  const [weeklyXP, setWeeklyXP] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<any[]>([]);
  const [balance, setBalance] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      // Load daily XP leaderboard
      const { data: dailyData } = await supabase
        .from("profiles")
        .select("id, character_name, character_level, total_xp")
        .order("total_xp", { ascending: false })
        .limit(50);
      setDailyXP(dailyData || []);

      // Load weekly XP (sum of weekly_xp from all areas)
      const { data: weeklyData } = await supabase
        .from("area_progress")
        .select("user_id, weekly_xp, profiles(character_name, character_level)");
      
      const weeklyAggregated = weeklyData?.reduce((acc: any[], curr) => {
        const existing = acc.find(item => item.user_id === curr.user_id);
        if (existing) {
          existing.weekly_xp += curr.weekly_xp;
        } else {
          acc.push({
            user_id: curr.user_id,
            weekly_xp: curr.weekly_xp,
            character_name: (curr.profiles as any)?.character_name,
            character_level: (curr.profiles as any)?.character_level
          });
        }
        return acc;
      }, []);
      
      weeklyAggregated?.sort((a, b) => b.weekly_xp - a.weekly_xp);
      setWeeklyXP(weeklyAggregated?.slice(0, 50) || []);

      // Load streaks leaderboard
      const { data: streaksData } = await supabase
        .from("streaks")
        .select("user_id, current_count, area, profiles(character_name, character_level)");
      
      const streaksAggregated = streaksData?.reduce((acc: any[], curr) => {
        const existing = acc.find(item => item.user_id === curr.user_id);
        if (existing) {
          existing.total_streak += curr.current_count;
        } else {
          acc.push({
            user_id: curr.user_id,
            total_streak: curr.current_count,
            character_name: (curr.profiles as any)?.character_name,
            character_level: (curr.profiles as any)?.character_level
          });
        }
        return acc;
      }, []);
      
      streaksAggregated?.sort((a, b) => b.total_streak - a.total_streak);
      setStreaks(streaksAggregated?.slice(0, 50) || []);

      // Load balance leaderboard (count areas with weekly_xp >= 60)
      const { data: balanceData } = await supabase
        .from("area_progress")
        .select("user_id, weekly_xp, profiles(character_name, character_level)");
      
      const balanceAggregated = balanceData?.reduce((acc: any[], curr) => {
        const existing = acc.find(item => item.user_id === curr.user_id);
        const hasMetTarget = curr.weekly_xp >= 60;
        if (existing) {
          if (hasMetTarget) existing.balanced_areas += 1;
        } else {
          acc.push({
            user_id: curr.user_id,
            balanced_areas: hasMetTarget ? 1 : 0,
            character_name: (curr.profiles as any)?.character_name,
            character_level: (curr.profiles as any)?.character_level
          });
        }
        return acc;
      }, []);
      
      balanceAggregated?.sort((a, b) => b.balanced_areas - a.balanced_areas);
      setBalance(balanceAggregated?.slice(0, 50) || []);

    } catch (error) {
      console.error("Error loading leaderboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600">🥉 3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const LeaderboardTable = ({ data, scoreKey, scoreLabel, icon }: any) => (
    <div className="space-y-2">
      {data.map((entry: any, index: number) => {
        const isCurrentUser = entry.user_id === currentUser?.id || entry.id === currentUser?.id;
        return (
          <Card 
            key={entry.user_id || entry.id} 
            className={isCurrentUser ? "border-primary bg-primary/5" : ""}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getRankBadge(index + 1)}
                  <div>
                    <p className="font-semibold">
                      {entry.character_name}
                      {isCurrentUser && <span className="text-primary ml-2">(You)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Level {entry.character_level}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-2xl font-bold">{entry[scoreKey]}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{scoreLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  if (loading) {
    return <div className="p-8">Loading leaderboards...</div>;
  }

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

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-4xl font-bold">Leaderboards</h1>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily">Daily XP</TabsTrigger>
            <TabsTrigger value="weekly">Weekly XP</TabsTrigger>
            <TabsTrigger value="streaks">Streaks</TabsTrigger>
            <TabsTrigger value="balance">Balance</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Daily XP Champions</CardTitle>
                <CardDescription>
                  Top adventurers by total XP earned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardTable 
                  data={dailyXP}
                  scoreKey="total_xp"
                  scoreLabel="Total XP"
                  icon={<TrendingUp className="w-5 h-5 text-primary" />}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Warriors</CardTitle>
                <CardDescription>
                  Most XP earned this week across all areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardTable 
                  data={weeklyXP}
                  scoreKey="weekly_xp"
                  scoreLabel="Weekly XP"
                  icon={<Trophy className="w-5 h-5 text-yellow-500" />}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streaks">
            <Card>
              <CardHeader>
                <CardTitle>Streak Masters</CardTitle>
                <CardDescription>
                  Longest combined streaks across all areas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardTable 
                  data={streaks}
                  scoreKey="total_streak"
                  scoreLabel="Total Streak Days"
                  icon={<Flame className="w-5 h-5 text-destructive" />}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Balance Champions</CardTitle>
                <CardDescription>
                  Most life areas hitting weekly targets (60+ XP)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LeaderboardTable 
                  data={balance}
                  scoreKey="balanced_areas"
                  scoreLabel="Balanced Areas"
                  icon={<Target className="w-5 h-5 text-primary" />}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
