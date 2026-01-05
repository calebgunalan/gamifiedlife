import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

interface DailyXP {
  date: string;
  xp: number;
}

interface AreaDistribution {
  name: string;
  value: number;
  color: string;
}

const AREA_COLORS: Record<string, string> = {
  physical: "#ef4444",
  mental: "#3b82f6",
  productivity: "#22c55e",
  social: "#f59e0b",
  financial: "#8b5cf6",
  personal: "#ec4899",
  spiritual: "#06b6d4"
};

export function TrendCharts() {
  const [dailyXP, setDailyXP] = useState<DailyXP[]>([]);
  const [areaDistribution, setAreaDistribution] = useState<AreaDistribution[]>([]);
  const [weeklyComparison, setWeeklyComparison] = useState<any[]>([]);
  const [streakHistory, setStreakHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 30 days of activity logs
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", thirtyDaysAgo.toISOString())
        .order("completed_at", { ascending: true });

      // Process daily XP
      const days = eachDayOfInterval({
        start: thirtyDaysAgo,
        end: new Date()
      });

      const dailyData = days.map(day => {
        const dayLogs = (logs || []).filter(log => {
          const logDate = startOfDay(new Date(log.completed_at));
          return logDate.getTime() === startOfDay(day).getTime();
        });
        return {
          date: format(day, "MMM d"),
          xp: dayLogs.reduce((sum, log) => sum + log.xp_earned, 0)
        };
      });

      setDailyXP(dailyData);

      // Calculate area distribution
      const areaXP: Record<string, number> = {};
      (logs || []).forEach(log => {
        areaXP[log.area] = (areaXP[log.area] || 0) + log.xp_earned;
      });

      const distribution = Object.entries(areaXP).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: AREA_COLORS[name] || "#888"
      }));

      setAreaDistribution(distribution);

      // Weekly comparison (last 4 weeks)
      const weeklyData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = subDays(new Date(), (i + 1) * 7);
        const weekEnd = subDays(new Date(), i * 7);
        const weekLogs = (logs || []).filter(log => {
          const logDate = new Date(log.completed_at);
          return logDate >= weekStart && logDate < weekEnd;
        });
        weeklyData.push({
          week: `Week ${4 - i}`,
          xp: weekLogs.reduce((sum, log) => sum + log.xp_earned, 0),
          activities: weekLogs.length
        });
      }
      setWeeklyComparison(weeklyData);

      // Load streaks
      const { data: streaks } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id);

      const streakData = (streaks || []).map(streak => ({
        area: streak.area.charAt(0).toUpperCase() + streak.area.slice(1),
        current: streak.current_count,
        best: streak.longest_count,
        color: AREA_COLORS[streak.area] || "#888"
      }));

      setStreakHistory(streakData);

    } catch (error) {
      console.error("Error loading chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading charts...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily XP</TabsTrigger>
          <TabsTrigger value="areas">By Area</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="streaks">Streaks</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily XP Earned</CardTitle>
              <CardDescription>Your XP progress over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyXP}>
                    <defs>
                      <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="xp"
                      stroke="hsl(var(--primary))"
                      fill="url(#xpGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>XP Distribution by Area</CardTitle>
              <CardDescription>How your effort is spread across life dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areaDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {areaDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Comparison</CardTitle>
              <CardDescription>Compare your performance across weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="xp" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="XP Earned"
                    />
                    <Bar 
                      dataKey="activities" 
                      fill="hsl(var(--secondary))" 
                      radius={[4, 4, 0, 0]}
                      name="Activities"
                    />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streaks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Streak Progress</CardTitle>
              <CardDescription>Current vs best streaks by area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={streakHistory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="area" 
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="current" 
                      fill="hsl(var(--primary))" 
                      name="Current Streak"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar 
                      dataKey="best" 
                      fill="hsl(var(--muted))" 
                      name="Best Streak"
                      radius={[0, 4, 4, 0]}
                    />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
