import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Swords, Plus, Users, Target } from "lucide-react";

export default function Challenges() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [myChallenges, setMyChallenges] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [challengeName, setChallengeName] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [challengeType, setChallengeType] = useState("solo");
  const [area, setArea] = useState("physical");
  const [xpReward, setXpReward] = useState(50);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all active challenges
      const { data: allChallenges } = await supabase
        .from("challenges")
        .select("*")
        .gte("end_date", new Date().toISOString().split('T')[0])
        .order("created_at", { ascending: false });

      setChallenges(allChallenges || []);

      // Load challenges user is participating in
      const { data: participations } = await supabase
        .from("challenge_participants")
        .select("*, challenges(*)")
        .eq("user_id", user.id);

      setMyChallenges(participations || []);
    } catch (error) {
      console.error("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    if (!challengeName.trim() || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: challenge, error } = await supabase
        .from("challenges")
        .insert({
          name: challengeName,
          description: challengeDescription,
          challenge_type: challengeType,
          area: area as any,
          xp_reward: xpReward,
          start_date: startDate,
          end_date: endDate,
          created_by: user.id
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Auto-join as creator
      await supabase.from("challenge_participants").insert({
        challenge_id: challenge.id,
        user_id: user.id
      });

      toast({
        title: "Challenge Created! ⚔️",
        description: `${challengeName} is ready for adventurers!`
      });

      setChallengeName("");
      setChallengeDescription("");
      setShowCreateForm(false);
      loadChallenges();
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive"
      });
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("challenge_participants").insert({
        challenge_id: challengeId,
        user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Challenge Accepted! ⚔️",
        description: "Show them what you're made of!"
      });

      loadChallenges();
    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join challenge",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading challenges...</div>;
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Challenges</h1>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Challenge</CardTitle>
              <CardDescription>
                Set a goal and challenge yourself or others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Challenge Name</label>
                <Input
                  placeholder="30-Day Fitness Challenge"
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Complete a workout every day for 30 days"
                  value={challengeDescription}
                  onChange={(e) => setChallengeDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={challengeType} onValueChange={setChallengeType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">Solo Challenge</SelectItem>
                      <SelectItem value="party">Party Challenge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Life Area</label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">Physical</SelectItem>
                      <SelectItem value="mental">Mental</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="spiritual">Spiritual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">XP Reward</label>
                  <Input
                    type="number"
                    value={xpReward}
                    onChange={(e) => setXpReward(parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createChallenge}>Create Challenge</Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Challenges</TabsTrigger>
            <TabsTrigger value="mine">My Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {challenges.map((challenge) => {
                const isParticipating = myChallenges.some((p: any) => p.challenge_id === challenge.id);
                const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={challenge.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{challenge.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {challenge.description}
                          </CardDescription>
                        </div>
                        {challenge.challenge_type === 'party' && (
                          <Users className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Badge variant="outline">{challenge.area}</Badge>
                          <Badge>+{challenge.xp_reward} XP</Badge>
                          <Badge variant="secondary">
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                          </span>
                          {!isParticipating && daysLeft > 0 && (
                            <Button 
                              size="sm"
                              onClick={() => joinChallenge(challenge.id)}
                            >
                              <Target className="w-4 h-4 mr-2" />
                              Join
                            </Button>
                          )}
                          {isParticipating && (
                            <Badge className="bg-primary">Participating</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="mine">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myChallenges.map((participation: any) => {
                const challenge = participation.challenges;
                const daysLeft = Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={participation.id} className="border-primary/50">
                    <CardHeader>
                      <CardTitle>{challenge.name}</CardTitle>
                      <CardDescription>{challenge.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Badge variant="outline">{challenge.area}</Badge>
                          <Badge>+{challenge.xp_reward} XP</Badge>
                          <Badge variant="secondary">
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
                          </Badge>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{participation.progress}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${participation.progress}%` }}
                            />
                          </div>
                        </div>
                        {participation.completed && (
                          <Badge className="w-full justify-center bg-green-500">
                            ✓ Completed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {myChallenges.length === 0 && (
                <p className="text-muted-foreground col-span-2 text-center py-8">
                  You haven't joined any challenges yet. Check the All Challenges tab!
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
