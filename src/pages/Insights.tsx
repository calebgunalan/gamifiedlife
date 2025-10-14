import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Insights() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load area progress
      const { data: areaProgress } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", user.id);

      // Load activity logs count
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Load streaks
      const { data: streaks } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", user.id);

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setStats({
        areaProgress,
        totalActivities: logs?.length || 0,
        streaks,
        profile
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all user data
      const { data: activities } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      // Convert to CSV
      const csv = [
        ["Date", "Area", "XP", "Notes"].join(","),
        ...(activities || []).map(a => 
          [
            new Date(a.completed_at).toLocaleDateString(),
            a.area,
            a.xp_earned,
            `"${a.notes || ""}"`
          ].join(",")
        )
      ].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rpg-life-data-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();

      toast({
        title: "Data Exported! 📊",
        description: "Your activity data has been downloaded."
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading insights...</div>;
  }

  const totalXP = stats?.areaProgress?.reduce((sum: number, area: any) => sum + area.total_xp, 0) || 0;
  const weeklyXP = stats?.areaProgress?.reduce((sum: number, area: any) => sum + area.weekly_xp, 0) || 0;
  const balancedAreas = stats?.areaProgress?.filter((area: any) => area.weekly_xp >= 36).length || 0;

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Insights</h1>
          </div>
          <Button onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total XP</CardDescription>
                <CardTitle className="text-3xl text-xp">{totalXP}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Weekly XP</CardDescription>
                <CardTitle className="text-3xl text-emerald">{weeklyXP}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Activities Logged</CardDescription>
                <CardTitle className="text-3xl text-amethyst">
                  {stats?.totalActivities}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Balanced Areas</CardDescription>
                <CardTitle className="text-3xl text-gold">
                  {balancedAreas}/7
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Area Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Area Progress</CardTitle>
              <CardDescription>
                Your growth across all seven dimensions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.areaProgress?.map((area: any) => (
                  <div key={area.id}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {area.area.replace("_", " ")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Level {area.level} • {area.total_xp} XP
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary"
                        style={{ 
                          width: `${Math.min((area.weekly_xp / 36) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Streaks */}
          <Card>
            <CardHeader>
              <CardTitle>Streaks</CardTitle>
              <CardDescription>
                Your consistency across life areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats?.streaks?.map((streak: any) => (
                  <div key={streak.id} className="text-center">
                    <div className="text-3xl mb-1">🔥</div>
                    <div className="text-2xl font-bold text-ruby">
                      {streak.current_count}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {streak.area}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Best: {streak.longest_count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}