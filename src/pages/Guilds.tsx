import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Plus, Users, Crown, Search } from "lucide-react";

const areaLabels: Record<string, { label: string; icon: string }> = {
  physical: { label: "Physical Health", icon: "💪" },
  mental: { label: "Mental Development", icon: "🧠" },
  productivity: { label: "Productivity", icon: "⚡" },
  social: { label: "Social", icon: "👥" },
  financial: { label: "Financial", icon: "💰" },
  personal: { label: "Personal Growth", icon: "🌟" },
  spiritual: { label: "Spiritual", icon: "✨" }
};

interface Guild {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  member_count: number;
  max_members: number;
  focus_area: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
}

export default function Guilds() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [publicGuilds, setPublicGuilds] = useState<Guild[]>([]);
  const [myGuilds, setMyGuilds] = useState<Guild[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGuild, setNewGuild] = useState({
    name: "",
    description: "",
    icon: "⚔️",
    focus_area: "",
    is_public: true
  });

  useEffect(() => {
    loadGuilds();
  }, []);

  const loadGuilds = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load public guilds
      const { data: publicData } = await supabase
        .from("guilds")
        .select("*")
        .eq("is_public", true)
        .order("member_count", { ascending: false });

      // Load my guilds (guilds I'm a member of)
      const { data: myMemberships } = await supabase
        .from("guild_members")
        .select("guild_id")
        .eq("user_id", user.id);

      const myGuildIds = myMemberships?.map(m => m.guild_id) || [];

      if (myGuildIds.length > 0) {
        const { data: myGuildsData } = await supabase
          .from("guilds")
          .select("*")
          .in("id", myGuildIds);
        setMyGuilds(myGuildsData || []);
      }

      setPublicGuilds(publicData || []);
    } catch (error) {
      console.error("Error loading guilds:", error);
    } finally {
      setLoading(false);
    }
  };

  const createGuild = async () => {
    if (!newGuild.name.trim()) {
      toast({ title: "Please enter a guild name", variant: "destructive" });
      return;
    }

    try {
      setCreating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const insertData: any = {
        name: newGuild.name,
        description: newGuild.description || null,
        icon: newGuild.icon,
        focus_area: newGuild.focus_area || null,
        is_public: newGuild.is_public,
        created_by: user.id,
        member_count: 1
      };

      const { data: guild, error } = await supabase
        .from("guilds")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase.from("guild_members").insert({
        guild_id: guild.id,
        user_id: user.id,
        role: "owner"
      } as any);

      toast({ title: "Guild Created! ⚔️", description: `Welcome to ${guild.name}` });
      setShowCreateDialog(false);
      setNewGuild({ name: "", description: "", icon: "⚔️", focus_area: "", is_public: true });
      loadGuilds();
    } catch (error) {
      console.error("Error creating guild:", error);
      toast({ title: "Error", description: "Failed to create guild", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const joinGuild = async (guildId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already a member
      const { data: existing } = await supabase
        .from("guild_members")
        .select("id")
        .eq("guild_id", guildId)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        toast({ title: "Already a member", description: "You're already in this guild" });
        return;
      }

      const { error } = await supabase.from("guild_members").insert({
        guild_id: guildId,
        user_id: user.id,
        role: "member"
      });

      if (error) throw error;

      // Update member count
      const guild = publicGuilds.find(g => g.id === guildId);
      if (guild) {
        await supabase
          .from("guilds")
          .update({ member_count: guild.member_count + 1 })
          .eq("id", guildId);
      }

      toast({ title: "Joined Guild! 🎉" });
      loadGuilds();
    } catch (error) {
      console.error("Error joining guild:", error);
      toast({ title: "Error", description: "Failed to join guild", variant: "destructive" });
    }
  };

  const leaveGuild = async (guildId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("guild_members")
        .delete()
        .eq("guild_id", guildId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update member count
      const guild = myGuilds.find(g => g.id === guildId);
      if (guild) {
        await supabase
          .from("guilds")
          .update({ member_count: Math.max(0, guild.member_count - 1) })
          .eq("id", guildId);
      }

      toast({ title: "Left Guild" });
      loadGuilds();
    } catch (error) {
      console.error("Error leaving guild:", error);
      toast({ title: "Error", description: "Failed to leave guild", variant: "destructive" });
    }
  };

  const filteredPublicGuilds = publicGuilds.filter(guild =>
    guild.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guild.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myGuildIds = new Set(myGuilds.map(g => g.id));

  if (loading) {
    return <div className="min-h-screen p-8 flex items-center justify-center">Loading guilds...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Guilds</h1>
          </div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Guild
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Guild</DialogTitle>
                <DialogDescription>Build a community around your goals</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Guild Name</label>
                  <Input
                    value={newGuild.name}
                    onChange={(e) => setNewGuild({ ...newGuild, name: e.target.value })}
                    placeholder="e.g., Morning Warriors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newGuild.description}
                    onChange={(e) => setNewGuild({ ...newGuild, description: e.target.value })}
                    placeholder="What's your guild about?"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Select value={newGuild.icon} onValueChange={(v) => setNewGuild({ ...newGuild, icon: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="⚔️">⚔️ Swords</SelectItem>
                      <SelectItem value="🛡️">🛡️ Shield</SelectItem>
                      <SelectItem value="🏰">🏰 Castle</SelectItem>
                      <SelectItem value="🐉">🐉 Dragon</SelectItem>
                      <SelectItem value="⭐">⭐ Star</SelectItem>
                      <SelectItem value="🔥">🔥 Fire</SelectItem>
                      <SelectItem value="💎">💎 Diamond</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Focus Area (Optional)</label>
                  <Select value={newGuild.focus_area} onValueChange={(v) => setNewGuild({ ...newGuild, focus_area: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a focus area" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(areaLabels).map(([key, { label, icon }]) => (
                        <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={createGuild} disabled={creating} className="w-full">
                  {creating ? "Creating..." : "Create Guild"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="my-guilds">My Guilds ({myGuilds.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guilds..."
                className="pl-10"
              />
            </div>

            {filteredPublicGuilds.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  No guilds found. Be the first to create one!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPublicGuilds.map(guild => (
                  <Card key={guild.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{guild.icon}</span>
                          <div>
                            <CardTitle className="text-xl">{guild.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Users className="w-4 h-4" />
                              {guild.member_count} / {guild.max_members} members
                            </CardDescription>
                          </div>
                        </div>
                        {guild.focus_area && areaLabels[guild.focus_area] && (
                          <Badge variant="secondary">
                            {areaLabels[guild.focus_area].icon} {areaLabels[guild.focus_area].label}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {guild.description && (
                        <p className="text-muted-foreground text-sm mb-4">{guild.description}</p>
                      )}
                      {myGuildIds.has(guild.id) ? (
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                          ✓ Member
                        </Badge>
                      ) : (
                        <Button onClick={() => joinGuild(guild.id)}>
                          Join Guild
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-guilds" className="space-y-4">
            {myGuilds.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <p>You haven't joined any guilds yet.</p>
                  <p className="text-sm mt-2">Explore guilds in the Discover tab!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myGuilds.map(guild => (
                  <Card key={guild.id} className="border-primary/30">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{guild.icon}</span>
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              {guild.name}
                              {guild.created_by === guild.id && (
                                <Crown className="w-4 h-4 text-amber-500" />
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <Users className="w-4 h-4" />
                              {guild.member_count} members
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {guild.description && (
                        <p className="text-muted-foreground text-sm mb-4">{guild.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          View Guild
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => leaveGuild(guild.id)}
                        >
                          Leave
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