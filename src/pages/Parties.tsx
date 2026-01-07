import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Plus, UserPlus, MessageCircle } from "lucide-react";
import { PartyChat } from "@/components/PartyChat";

export default function Parties() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [parties, setParties] = useState<any[]>([]);
  const [myParties, setMyParties] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [partyDescription, setPartyDescription] = useState("");
  const [invitations, setInvitations] = useState<any[]>([]);
  const [showInviteForm, setShowInviteForm] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPartyForChat, setSelectedPartyForChat] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadParties();
    loadInvitations();
  }, []);

  const loadParties = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all parties
      const { data: allParties } = await supabase
        .from("parties")
        .select(`
          *,
          party_members(count)
        `)
        .order("created_at", { ascending: false });

      // Load parties user is a member of
      const { data: memberParties } = await supabase
        .from("party_members")
        .select(`
          party_id,
          parties(*)
        `)
        .eq("user_id", user.id);

      setParties(allParties || []);
      setMyParties(memberParties?.map(m => m.parties) || []);
    } catch (error) {
      console.error("Error loading parties:", error);
    } finally {
      setLoading(false);
    }
  };

  const createParty = async () => {
    if (!partyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a party name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: party, error } = await supabase
        .from("parties")
        .insert({
          name: partyName,
          description: partyDescription,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as creator
      await supabase.from("party_members").insert({
        party_id: party.id,
        user_id: user.id
      });

      toast({
        title: "Party Created! 🎉",
        description: `${partyName} is ready for adventurers!`
      });

      setPartyName("");
      setPartyDescription("");
      setShowCreateForm(false);
      loadParties();
    } catch (error) {
      console.error("Error creating party:", error);
      toast({
        title: "Error",
        description: "Failed to create party",
        variant: "destructive"
      });
    }
  };

  const joinParty = async (partyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("party_members").insert({
        party_id: partyId,
        user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Joined Party! 🎊",
        description: "You're now part of the adventure!"
      });

      loadParties();
    } catch (error: any) {
      console.error("Error joining party:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to join party",
        variant: "destructive"
      });
    }
  };

  const loadInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("party_invitations" as any)
        .select(`
          *,
          parties(name),
          profiles!party_invitations_invited_by_fkey(character_name)
        `)
        .eq("invited_user_id", user.id)
        .eq("status", "pending");

      setInvitations(data || []);
    } catch (error) {
      console.error("Error loading invitations:", error);
    }
  };

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const invitation = invitations.find(i => i.id === invitationId);
      if (!invitation) return;

      await supabase
        .from("party_invitations" as any)
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", invitationId);

      if (accept) {
        await supabase.from("party_members").insert({
          party_id: invitation.party_id,
          user_id: user.id
        });
      }

      toast({
        title: accept ? "Invitation Accepted! 🎉" : "Invitation Declined",
        description: accept ? "You've joined the party!" : "Invitation declined."
      });

      loadInvitations();
      loadParties();
    } catch (error) {
      console.error("Error responding to invitation:", error);
      toast({
        title: "Error",
        description: "Failed to respond to invitation",
        variant: "destructive"
      });
    }
  };

  const sendInvitation = async (partyId: string) => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find user by email (simplified - in production would need proper lookup)
      const { data: invitedUser } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();

      if (!invitedUser) {
        toast({
          title: "User Not Found",
          description: "No user found with that email.",
          variant: "destructive"
        });
        return;
      }

      await supabase.from("party_invitations" as any).insert({
        party_id: partyId,
        invited_user_id: invitedUser.id,
        invited_by: user.id
      });

      toast({
        title: "Invitation Sent! 📨",
        description: "The user will receive your invitation."
      });

      setInviteEmail("");
      setShowInviteForm(null);
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading parties...</div>;
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Parties</h1>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Party
          </Button>
        </div>

        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Party</CardTitle>
              <CardDescription>
                Form a party to embark on quests together
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Party Name
                </label>
                <Input
                  placeholder="Enter party name..."
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Description
                </label>
                <Textarea
                  placeholder="What's your party about?"
                  value={partyDescription}
                  onChange={(e) => setPartyDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createParty}>Create Party</Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {myParties.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">My Parties</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myParties.map((party: any) => (
                    <Card 
                      key={party.id} 
                      className={`border-primary/50 cursor-pointer transition-all ${selectedPartyForChat?.id === party.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setSelectedPartyForChat({ id: party.id, name: party.name })}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {party.name}
                          <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>{party.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Member
                          </span>
                        </div>
                        {showInviteForm === party.id ? (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              placeholder="Enter email to invite..."
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => sendInvitation(party.id)}
                              >
                                Send
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setShowInviteForm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowInviteForm(party.id);
                            }}
                            className="w-full"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Invite Member
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          <div>
            <h2 className="text-2xl font-bold mb-4">All Parties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parties.map(party => {
                const isMember = myParties.some((p: any) => p.id === party.id);
                return (
                  <Card key={party.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle>{party.name}</CardTitle>
                      <CardDescription>{party.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {party.party_members?.[0]?.count || 0} members
                        </span>
                        {!isMember && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => joinParty(party.id)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Join
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-1">
            {selectedPartyForChat ? (
              <PartyChat 
                partyId={selectedPartyForChat.id} 
                partyName={selectedPartyForChat.name} 
              />
            ) : (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a party to start chatting</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}