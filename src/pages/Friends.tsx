import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, UserPlus, Check, X, Eye } from "lucide-react";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profile?: {
    character_name: string;
    character_level: number;
    total_xp: number;
  };
}

export default function Friends() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Get all friendships
      const { data: friendships, error } = await supabase
        .from("friends")
        .select("*")
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

      if (error) throw error;

      // Separate into categories
      const accepted: Friend[] = [];
      const pending: Friend[] = [];
      const sent: Friend[] = [];

      for (const f of friendships || []) {
        const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
        
        // Fetch profile for each friend
        const { data: profile } = await supabase
          .from("profiles")
          .select("character_name, character_level, total_xp")
          .eq("id", otherId)
          .single();

        const friendWithProfile = { ...f, profile };

        if (f.status === "accepted") {
          accepted.push(friendWithProfile);
        } else if (f.status === "pending" && f.friend_id === user.id) {
          pending.push(friendWithProfile);
        } else if (f.status === "pending" && f.user_id === user.id) {
          sent.push(friendWithProfile);
        }
      }

      setFriends(accepted);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!searchEmail.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find user by email
      const { data: targetUser, error: searchError } = await supabase
        .from("profiles")
        .select("id, character_name")
        .eq("email", searchEmail.trim())
        .single();

      if (searchError || !targetUser) {
        toast({
          title: "User not found",
          description: "No user found with that email address.",
          variant: "destructive"
        });
        return;
      }

      if (targetUser.id === user.id) {
        toast({
          title: "Invalid request",
          description: "You can't send a friend request to yourself!",
          variant: "destructive"
        });
        return;
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from("friends")
        .select("*")
        .or(`and(user_id.eq.${user.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${user.id})`)
        .single();

      if (existing) {
        toast({
          title: "Request exists",
          description: "A friend request already exists with this user.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("friends")
        .insert({
          user_id: user.id,
          friend_id: targetUser.id,
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Request Sent! 📨",
        description: `Friend request sent to ${targetUser.character_name}.`
      });

      setSearchEmail("");
      loadFriends();
    } catch (error) {
      console.error("Error sending request:", error);
      toast({
        title: "Error",
        description: "Failed to send friend request.",
        variant: "destructive"
      });
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Friend Added! 🎉",
        description: "You are now friends!"
      });

      loadFriends();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const rejectRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Request Declined",
        description: "Friend request has been declined."
      });

      loadFriends();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: "Friend Removed",
        description: "Friend has been removed from your list."
      });

      loadFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading friends...</div>;
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

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Friends</h1>
        </div>

        {/* Add Friend */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add Friend
            </CardTitle>
            <CardDescription>
              Send a friend request by email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                placeholder="Enter friend's email..."
                type="email"
              />
              <Button onClick={sendFriendRequest}>
                Send Request
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="friends">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-4">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No friends yet. Send some friend requests!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <Card key={friend.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                          ⚔️
                        </div>
                        <div>
                          <div className="font-medium">
                            {friend.profile?.character_name || "Adventurer"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Level {friend.profile?.character_level || 1} • {friend.profile?.total_xp || 0} XP
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/friend/${friend.user_id === currentUserId ? friend.friend_id : friend.user_id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFriend(friend.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending friend requests.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                          ⚔️
                        </div>
                        <div>
                          <div className="font-medium">
                            {request.profile?.character_name || "Adventurer"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Wants to be your friend
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => acceptRequest(request.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => rejectRequest(request.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent" className="mt-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No sent friend requests.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl">
                          ⏳
                        </div>
                        <div>
                          <div className="font-medium">
                            {request.profile?.character_name || "Adventurer"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Request pending...
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => rejectRequest(request.id)}
                      >
                        Cancel
                      </Button>
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
