import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, Pause, Heart, TreePine, HandHeart, History } from "lucide-react";
import { format } from "date-fns";

interface SpiritualLog {
  id: string;
  practice_type: string;
  duration_minutes: number | null;
  notes: string | null;
  xp_earned: number;
  created_at: string;
}

export default function SpiritualHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meditationTime, setMeditationTime] = useState(0);
  const [isMeditating, setIsMeditating] = useState(false);
  const [gratitudeEntry, setGratitudeEntry] = useState("");
  const [streaks, setStreaks] = useState<any>(null);
  const [natureTime, setNatureTime] = useState(0);
  const [isInNature, setIsInNature] = useState(false);
  const [serviceNotes, setServiceNotes] = useState("");
  const [recentLogs, setRecentLogs] = useState<SpiritualLog[]>([]);

  useEffect(() => {
    loadStreaks();
    loadRecentLogs();
    let meditationInterval: any;
    let natureInterval: any;
    
    if (isMeditating) {
      meditationInterval = setInterval(() => {
        setMeditationTime(prev => prev + 1);
      }, 1000);
    }
    
    if (isInNature) {
      natureInterval = setInterval(() => {
        setNatureTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      clearInterval(meditationInterval);
      clearInterval(natureInterval);
    };
  }, [isMeditating, isInNature]);

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

  const loadRecentLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("spiritual_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setRecentLogs(data);
  };

  const updateAreaProgress = async (userId: string, xp: number) => {
    const { data: progress } = await supabase
      .from("area_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("area", "spiritual")
      .single();

    if (progress) {
      await supabase
        .from("area_progress")
        .update({
          total_xp: (progress.total_xp || 0) + xp,
          weekly_xp: (progress.weekly_xp || 0) + xp
        })
        .eq("id", progress.id);
    }

    // Update profile total XP
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", userId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({ total_xp: (profile.total_xp || 0) + xp })
        .eq("id", userId);
    }
  };

  const updateStreak = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("area", "spiritual")
      .single();

    if (streak) {
      const lastActivity = streak.last_activity_date;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newCount = streak.current_count || 0;
      
      if (lastActivity !== today) {
        if (lastActivity === yesterdayStr) {
          newCount += 1;
        } else {
          newCount = 1;
        }

        await supabase
          .from("streaks")
          .update({
            current_count: newCount,
            longest_count: Math.max(newCount, streak.longest_count || 0),
            last_activity_date: today
          })
          .eq("id", streak.id);
      }
    }
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

      const xp = minutes * 2;

      await supabase.from("spiritual_logs").insert({
        user_id: user.id,
        practice_type: "meditation",
        duration_minutes: minutes,
        notes: `${minutes} minute meditation session`,
        xp_earned: xp
      });

      await updateAreaProgress(user.id, xp);
      await updateStreak(user.id);

      toast({
        title: "Meditation Complete 🧘",
        description: `You earned ${xp} XP for ${minutes} minutes of meditation!`
      });

      setMeditationTime(0);
      loadStreaks();
      loadRecentLogs();
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

      const xp = 5;

      await supabase.from("spiritual_logs").insert({
        user_id: user.id,
        practice_type: "gratitude",
        notes: gratitudeEntry,
        xp_earned: xp
      });

      await updateAreaProgress(user.id, xp);
      await updateStreak(user.id);

      toast({
        title: "Gratitude Logged 🙏",
        description: "You earned 5 XP!"
      });

      setGratitudeEntry("");
      loadStreaks();
      loadRecentLogs();
    } catch (error) {
      console.error("Error logging gratitude:", error);
      toast({
        title: "Error",
        description: "Failed to log gratitude",
        variant: "destructive"
      });
    }
  };

  const startNature = () => {
    setIsInNature(true);
    setNatureTime(0);
  };

  const stopNature = async () => {
    setIsInNature(false);
    const minutes = Math.floor(natureTime / 60);
    
    if (minutes < 1) {
      toast({
        title: "Session Too Short",
        description: "Spend at least 1 minute in nature to log it.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const xp = minutes * 3;

      await supabase.from("spiritual_logs").insert({
        user_id: user.id,
        practice_type: "nature",
        duration_minutes: minutes,
        notes: `${minutes} minutes in nature`,
        xp_earned: xp
      });

      await updateAreaProgress(user.id, xp);
      await updateStreak(user.id);

      toast({
        title: "Nature Time Logged 🌿",
        description: `You earned ${xp} XP for ${minutes} minutes in nature!`
      });

      setNatureTime(0);
      loadStreaks();
      loadRecentLogs();
    } catch (error) {
      console.error("Error logging nature time:", error);
      toast({
        title: "Error",
        description: "Failed to log nature time",
        variant: "destructive"
      });
    }
  };

  const logService = async () => {
    if (!serviceNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please describe your act of service.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const xp = 10;

      await supabase.from("spiritual_logs").insert({
        user_id: user.id,
        practice_type: "service",
        notes: serviceNotes,
        xp_earned: xp
      });

      await updateAreaProgress(user.id, xp);
      await updateStreak(user.id);

      toast({
        title: "Service Logged 🤝",
        description: "You earned 10 XP for your act of compassion!"
      });

      setServiceNotes("");
      loadStreaks();
      loadRecentLogs();
    } catch (error) {
      console.error("Error logging service:", error);
      toast({
        title: "Error",
        description: "Failed to log service",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPracticeIcon = (type: string) => {
    switch (type) {
      case 'meditation': return '🧘';
      case 'gratitude': return '🙏';
      case 'nature': return '🌿';
      case 'service': return '🤝';
      case 'prayer': return '✨';
      case 'mindfulness': return '🎯';
      default: return '💫';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
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
          {streaks && (
            <div className="ml-auto flex items-center gap-2 text-sm bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-xl">🔥</span>
              <span className="font-medium">{streaks.current_count} day streak</span>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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
                <p className="text-xs text-muted-foreground mt-2">+2 XP per minute</p>
              </div>
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
                className="min-h-24"
              />
              <Button onClick={logGratitude} className="w-full">
                Log Gratitude (+5 XP)
              </Button>
            </CardContent>
          </Card>

          {/* Nature Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5" />
                Nature Time
              </CardTitle>
              <CardDescription>
                Connect with nature and earn XP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-emerald-500 mb-6">
                  {formatTime(natureTime)}
                </div>
                <Button
                  size="lg"
                  onClick={isInNature ? stopNature : startNature}
                  className="w-48"
                >
                  {isInNature ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      End Nature Time
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Nature Time
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">+3 XP per minute</p>
              </div>
            </CardContent>
          </Card>

          {/* Service & Compassion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandHeart className="w-5 h-5" />
                Service & Compassion
              </CardTitle>
              <CardDescription>
                Log acts of kindness and service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Describe your act of service or compassion..."
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                className="min-h-24"
              />
              <Button onClick={logService} className="w-full">
                Log Service (+10 XP)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Spiritual Logs */}
        {recentLogs.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Recent Spiritual Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getPracticeIcon(log.practice_type)}</span>
                      <div>
                        <p className="font-medium capitalize">{log.practice_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.duration_minutes ? `${log.duration_minutes} min` : log.notes?.substring(0, 40)}
                          {log.notes && log.notes.length > 40 && '...'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">+{log.xp_earned} XP</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
