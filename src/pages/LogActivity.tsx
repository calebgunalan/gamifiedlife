import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";

const areas = [
  { value: "physical", label: "Physical Health" },
  { value: "mental", label: "Mental Development" },
  { value: "productivity", label: "Productivity" },
  { value: "social", label: "Social & Relationships" },
  { value: "financial", label: "Financial Prosperity" },
  { value: "personal", label: "Personal Growth" },
  { value: "spiritual", label: "Spiritual Connection" },
];

const LogActivity = () => {
  const navigate = useNavigate();
  const [area, setArea] = useState("");
  const [activityName, setActivityName] = useState("");
  const [xpValue, setXpValue] = useState("10");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const xp = parseInt(xpValue);

      // Create or get activity
      const { data: existingActivity } = await supabase
        .from("activities")
        .select("id")
        .eq("user_id", user.id)
        .eq("area", area as any)
        .eq("name", activityName)
        .maybeSingle();

      let activityId = existingActivity?.id;

      if (!activityId) {
        const { data: newActivity, error: activityError } = await supabase
          .from("activities")
          .insert([{
            area,
            name: activityName,
            xp_value: xp,
            is_custom: true,
          }] as any)
          .select()
          .single();

        if (activityError) throw activityError;
        activityId = newActivity.id;
      }

      // Log the activity
      const { error: logError } = await supabase
        .from("activity_logs")
        .insert([{
          activity_id: activityId,
          area,
          xp_earned: xp,
          notes,
        }] as any);

      if (logError) throw logError;

      // Update area progress
      const { data: areaData } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("area", area as any)
        .single();

      if (areaData) {
        const newTotalXp = areaData.total_xp + xp;
        const newWeeklyXp = areaData.weekly_xp + xp;
        const currentLevelXp = 100 * areaData.level;
        const newLevel = Math.floor(newTotalXp / currentLevelXp) + 1;

        await supabase
          .from("area_progress")
          .update({
            total_xp: newTotalXp,
            weekly_xp: newWeeklyXp,
            level: newLevel,
          })
          .eq("id", areaData.id);
      }

      // Update profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const newTotalXp = profileData.total_xp + xp;
        const newMonthlyXp = profileData.monthly_xp + xp;
        const currentLevelXp = 100 * profileData.character_level;
        const newLevel = Math.floor(newMonthlyXp / currentLevelXp) + 1;

        await supabase
          .from("profiles")
          .update({
            total_xp: newTotalXp,
            monthly_xp: newMonthlyXp,
            character_level: newLevel,
          })
          .eq("id", user.id);
      }

      toast.success(`+${xp} XP earned! 🎉`);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to log activity");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Plus className="w-6 h-6 text-primary" />
              Log Activity
            </CardTitle>
            <CardDescription>
              Track your progress and earn XP across all life dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area">Life Area</Label>
                <Select value={area} onValueChange={setArea} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a life area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityName">Activity Name</Label>
                <Input
                  id="activityName"
                  placeholder="e.g., Morning workout, Read a book, Meditate"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="xpValue">XP Value (1-50)</Label>
                <Input
                  id="xpValue"
                  type="number"
                  min="1"
                  max="50"
                  value={xpValue}
                  onChange={(e) => setXpValue(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Quick task: 5-10 XP | Medium task: 15-25 XP | Major task: 30-50 XP
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any thoughts or reflections..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Logging..." : "Log Activity & Earn XP"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LogActivity;
