import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Trophy, LogOut } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [characterName, setCharacterName] = useState("");
  const [achievements, setAchievements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any>(null);
  const [privacy, setPrivacy] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: userAchievements } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievements(*)
        `)
        .eq("user_id", user.id);

      const { data: notifData } = await supabase
        .from("notification_preferences" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: privacyData } = await supabase
        .from("privacy_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);
      setCharacterName(profileData?.character_name || "");
      setAchievements(userAchievements || []);
      setNotifications(notifData);
      setPrivacy(privacyData);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ character_name: characterName })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile Updated! ✨",
        description: "Your character name has been updated."
      });

      loadProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const updateNotifications = async (field: string, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("notification_preferences" as any)
        .update({ [field]: value })
        .eq("user_id", user.id);

      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved."
      });

      loadProfile();
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  };

  const updatePrivacy = async (field: string, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("privacy_settings" as any)
        .update({ [field]: value })
        .eq("user_id", user.id);

      toast({
        title: "Privacy Updated",
        description: "Your privacy settings have been saved."
      });

      loadProfile();
    } catch (error) {
      console.error("Error updating privacy:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return <div className="p-8">Loading profile...</div>;
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
          <User className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold">Profile</h1>
        </div>

        <div className="grid gap-6">
          {/* Character Info */}
          <Card>
            <CardHeader>
              <CardTitle>Character Information</CardTitle>
              <CardDescription>
                Manage your adventurer profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Character Name
                </label>
                <div className="flex gap-2">
                  <Input
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Enter character name..."
                  />
                  <Button onClick={updateProfile}>Save</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Level</div>
                  <div className="text-2xl font-bold text-gold">
                    {profile?.character_level || 1}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                  <div className="text-2xl font-bold text-xp">
                    {profile?.total_xp || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                Unlocked Achievements
              </CardTitle>
              <CardDescription>
                {achievements.length} achievements earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No achievements unlocked yet. Keep adventuring!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {achievements.map(ua => (
                    <div 
                      key={ua.id}
                      className="text-center p-4 rounded-lg border border-gold/30 bg-card"
                    >
                      <div className="text-4xl mb-2">
                        {ua.achievements?.icon}
                      </div>
                      <div className="font-medium">{ua.achievements?.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(ua.unlocked_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Daily Reminders</div>
                  <div className="text-sm text-muted-foreground">
                    Get reminded to log activities
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications?.daily_reminders ?? true}
                  onChange={(e) => updateNotifications("daily_reminders", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Quest Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Updates about quests and challenges
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications?.quest_reminders ?? true}
                  onChange={(e) => updateNotifications("quest_reminders", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Achievement Alerts</div>
                  <div className="text-sm text-muted-foreground">
                    Celebrate when you unlock achievements
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications?.achievement_alerts ?? true}
                  onChange={(e) => updateNotifications("achievement_alerts", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Receive email updates and summaries
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications?.email_enabled ?? true}
                  onChange={(e) => updateNotifications("email_enabled", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Streak Warning Emails</div>
                  <div className="text-sm text-muted-foreground">
                    Get notified when streaks are at risk
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications?.streak_warning_email ?? true}
                  onChange={(e) => updateNotifications("streak_warning_email", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Weekly Summary</div>
                  <div className="text-sm text-muted-foreground">
                    Receive weekly progress reports
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications?.weekly_summary_email ?? true}
                  onChange={(e) => updateNotifications("weekly_summary_email", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control your visibility and data sharing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Show on Leaderboards</div>
                  <div className="text-sm text-muted-foreground">
                    Appear in public rankings
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy?.show_on_leaderboards ?? true}
                  onChange={(e) => updatePrivacy("show_on_leaderboards", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Share Spiritual Progress</div>
                  <div className="text-sm text-muted-foreground">
                    Make spiritual stats visible to others
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy?.show_spiritual_progress ?? false}
                  onChange={(e) => updatePrivacy("show_spiritual_progress", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Allow Party Invites</div>
                  <div className="text-sm text-muted-foreground">
                    Let others invite you to parties
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy?.allow_party_invites ?? true}
                  onChange={(e) => updatePrivacy("allow_party_invites", e.target.checked)}
                  className="w-5 h-5"
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}