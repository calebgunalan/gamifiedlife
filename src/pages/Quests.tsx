import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Swords, Check, ArrowLeft } from "lucide-react";

export default function Quests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dailyQuests, setDailyQuests] = useState<any[]>([]);
  const [weeklyQuests, setWeeklyQuests] = useState<any[]>([]);
  const [userQuests, setUserQuests] = useState<any[]>([]);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load quest templates
      const { data: templates } = await supabase
        .from("quest_templates" as any)
        .select("*")
        .eq("is_active", true);

      // Load user's active quests
      const { data: quests } = await supabase
        .from("quests")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_completed", false);

      setDailyQuests(templates?.filter((t: any) => t.quest_type === "daily") || []);
      setWeeklyQuests(templates?.filter((t: any) => t.quest_type === "weekly") || []);
      setUserQuests(quests || []);
    } catch (error) {
      console.error("Error loading quests:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptQuest = async (template: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dueDate = template.quest_type === "daily" 
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { error } = await supabase.from("quests").insert({
        user_id: user.id,
        title: template.title,
        description: template.description,
        area: template.area,
        xp_reward: template.xp_reward,
        quest_type: template.quest_type,
        due_date: dueDate,
        is_completed: false
      });

      if (error) throw error;

      toast({
        title: "Quest Accepted!",
        description: `${template.title} has been added to your active quests.`
      });

      loadQuests();
    } catch (error) {
      console.error("Error accepting quest:", error);
      toast({
        title: "Error",
        description: "Failed to accept quest",
        variant: "destructive"
      });
    }
  };

  const completeQuest = async (quest: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("quests")
        .update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq("id", quest.id);

      if (error) throw error;

      // Award XP
      const { data: progress } = await supabase
        .from("area_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("area", quest.area)
        .single();

      if (progress) {
        await supabase
          .from("area_progress")
          .update({
            total_xp: progress.total_xp + quest.xp_reward,
            weekly_xp: progress.weekly_xp + quest.xp_reward
          })
          .eq("id", progress.id);
      }

      toast({
        title: "Quest Complete! 🎉",
        description: `You earned ${quest.xp_reward} XP!`
      });

      loadQuests();
    } catch (error) {
      console.error("Error completing quest:", error);
      toast({
        title: "Error",
        description: "Failed to complete quest",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "text-emerald";
      case "medium": return "text-xp";
      case "hard": return "text-ruby";
      default: return "text-foreground";
    }
  };

  if (loading) {
    return <div className="p-8">Loading quests...</div>;
  }

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
        <div className="flex items-center gap-3 mb-8">
          <Swords className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Quest Board</h1>
        </div>

        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Quests</TabsTrigger>
            <TabsTrigger value="weekly">Weekly Quests</TabsTrigger>
            <TabsTrigger value="active">Active ({userQuests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyQuests.map(quest => (
                <Card key={quest.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{quest.title}</CardTitle>
                      <Badge className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>{quest.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xp font-bold">+{quest.xp_reward} XP</span>
                      <Button onClick={() => acceptQuest(quest)}>
                        Accept Quest
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weeklyQuests.map(quest => (
                <Card key={quest.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{quest.title}</CardTitle>
                      <Badge className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </Badge>
                    </div>
                    <CardDescription>{quest.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-xp font-bold">+{quest.xp_reward} XP</span>
                      <Button onClick={() => acceptQuest(quest)}>
                        Accept Quest
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {userQuests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>No active quests. Accept some quests to get started!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userQuests.map(quest => (
                  <Card key={quest.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="text-xl">{quest.title}</CardTitle>
                      <CardDescription>{quest.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xp font-bold">+{quest.xp_reward} XP</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            Due: {new Date(quest.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button onClick={() => completeQuest(quest)}>
                          <Check className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}