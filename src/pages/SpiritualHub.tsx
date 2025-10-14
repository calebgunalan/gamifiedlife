import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, Pause, Heart, TreePine, HandHeart } from "lucide-react";

export default function SpiritualHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meditationTime, setMeditationTime] = useState(0);
  const [isMeditating, setIsMeditating] = useState(false);
  const [gratitudeEntry, setGratitudeEntry] = useState("");
  const [streaks, setStreaks] = useState<any>(null);

  useEffect(() => {
    loadStreaks();
    let interval: any;
    if (isMeditating) {
      interval = setInterval(() => {
        setMeditationTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMeditating]);

  const loadStreaks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .eq("area", "spiritual")
      .single();

    setStreaks(data);
  };

  const startMeditation = () => {
    setIsMeditating(true);
    setMeditationTime(0);
  };

  const stopMeditation = async () => {
    setIsMeditating(false);
    const minutes = Math.floor(meditationTime / 60);
    
    if (minutes < 1) {
      toast({
        title: "Session Too Short",
        description: "Meditate for at least 1 minute to log it.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("spiritual_logs" as any).insert({
        user_id: user.id,
        practice_type: "meditation",
        duration_minutes: minutes,
        notes: `${minutes} minute meditation session`
      });

      // Award XP
      const xp = minutes * 2;
      const { data: progress } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("area", "spiritual")
        .single();

      if (progress) {
        await supabase
          .from("area_progress")
          .update({
            total_xp: progress.total_xp + xp,
            weekly_xp: progress.weekly_xp + xp
          })
          .eq("id", progress.id);
      }

      toast({
        title: "Meditation Complete 🧘",
        description: `You earned ${xp} XP for ${minutes} minutes of meditation!`
      });

      setMeditationTime(0);
      loadStreaks();
    } catch (error) {
      console.error("Error logging meditation:", error);
      toast({
        title: "Error",
        description: "Failed to log meditation",
        variant: "destructive"
      });
    }
  };

  const logGratitude = async () => {
    if (!gratitudeEntry.trim()) {
      toast({
        title: "Empty Entry",
        description: "Please write something you're grateful for.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("spiritual_logs" as any).insert({
        user_id: user.id,
        practice_type: "gratitude",
        notes: gratitudeEntry
      });

      // Award XP
      const { data: progress } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("area", "spiritual")
        .single();

      if (progress) {
        await supabase
          .from("area_progress")
          .update({
            total_xp: progress.total_xp + 5,
            weekly_xp: progress.weekly_xp + 5
          })
          .eq("id", progress.id);
      }

      toast({
        title: "Gratitude Logged 🙏",
        description: "You earned 5 XP!"
      });

      setGratitudeEntry("");
      loadStreaks();
    } catch (error) {
      console.error("Error logging gratitude:", error);
      toast({
        title: "Error",
        description: "Failed to log gratitude",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Spiritual Hub</h1>
        </div>

        <div className="grid gap-6">
          {/* Meditation Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🧘 Meditation Timer
              </CardTitle>
              <CardDescription>
                Practice mindfulness and inner peace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-6">
                  {formatTime(meditationTime)}
                </div>
                <Button
                  size="lg"
                  onClick={isMeditating ? stopMeditation : startMeditation}
                  className="w-48"
                >
                  {isMeditating ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      End Session
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Meditating
                    </>
                  )}
                </Button>
              </div>
              {streaks && (
                <div className="text-center text-sm text-muted-foreground">
                  Current streak: {streaks.current_count} days 🔥
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gratitude Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🙏 Gratitude Journal
              </CardTitle>
              <CardDescription>
                What are you grateful for today?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="I'm grateful for..."
                value={gratitudeEntry}
                onChange={(e) => setGratitudeEntry(e.target.value)}
                className="min-h-32"
              />
              <Button onClick={logGratitude} className="w-full">
                Log Gratitude (+5 XP)
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TreePine className="w-5 h-5" />
                  Nature Time
                </CardTitle>
                <CardDescription>
                  Log time spent in nature
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HandHeart className="w-5 h-5" />
                  Service & Compassion
                </CardTitle>
                <CardDescription>
                  Track acts of kindness
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}