import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Target, Clock, ArrowRight, ArrowLeft, Check, Shield } from "lucide-react";

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface CharacterClass {
  id: string;
  name: string;
  description: string;
  icon: string;
  primary_area: string | null;
  secondary_area: string | null;
}

const LIFE_AREAS = [
  { id: "physical", name: "Physical Health", emoji: "💪", description: "Exercise, nutrition, sleep" },
  { id: "mental", name: "Mental Growth", emoji: "🧠", description: "Learning, reading, skills" },
  { id: "productivity", name: "Productivity", emoji: "⚡", description: "Work, projects, goals" },
  { id: "social", name: "Social Life", emoji: "👥", description: "Relationships, networking" },
  { id: "financial", name: "Financial", emoji: "💰", description: "Saving, investing, budgeting" },
  { id: "personal", name: "Personal", emoji: "🌟", description: "Hobbies, self-care, growth" },
  { id: "spiritual", name: "Spiritual", emoji: "🧘", description: "Meditation, mindfulness, gratitude" },
];

const COMMITMENT_LEVELS = [
  { id: "casual", name: "Casual Explorer", time: "5-10 min/day", xpGoal: "20 XP", description: "Perfect for getting started" },
  { id: "medium", name: "Dedicated Adventurer", time: "15-30 min/day", xpGoal: "36 XP", description: "Balanced growth across areas" },
  { id: "intense", name: "Elite Warrior", time: "45+ min/day", xpGoal: "60 XP", description: "Maximum progress and achievements" },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [commitment, setCommitment] = useState("medium");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [classes, setClasses] = useState<CharacterClass[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    const { data } = await supabase
      .from("character_classes")
      .select("*");
    if (data) setClasses(data);
  };

  const toggleArea = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(a => a !== areaId)
        : [...prev, areaId]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile with selected class
      if (selectedClass) {
        await supabase
          .from("profiles")
          .update({ class_id: selectedClass })
          .eq("id", user.id);
      }

      await supabase.from("user_onboarding").insert({
        user_id: user.id,
        is_completed: true,
        focus_areas: selectedAreas,
        commitment_level: commitment,
        completed_at: new Date().toISOString()
      });

      // Create welcome notification
      await supabase.from("in_app_notifications").insert({
        user_id: user.id,
        title: "Welcome, Adventurer! 🎉",
        message: "Your journey begins now. Start by logging your first activity!",
        type: "success",
        action_url: "/log-activity"
      });

      // Log first daily login
      await supabase.from("daily_logins").insert({
        user_id: user.id,
        login_date: new Date().toISOString().split('T')[0],
        consecutive_days: 1
      });

      toast({
        title: "Welcome to Full Gamified Life! 🎮",
        description: "Your adventure begins now. Let's level up together!"
      });

      onComplete();
    } catch (error) {
      console.error("Error saving onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/30 shadow-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full mx-1 transition-colors ${
                  s === step ? "bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {step === 1 && <><Sparkles className="w-6 h-6 text-primary" /> Welcome, Adventurer!</>}
            {step === 2 && <><Shield className="w-6 h-6 text-primary" /> Choose Your Class</>}
            {step === 3 && <><Target className="w-6 h-6 text-primary" /> Choose Your Focus</>}
            {step === 4 && <><Clock className="w-6 h-6 text-primary" /> Set Your Pace</>}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Let's customize your journey to level up your life"}
            {step === 2 && "Select your character class for XP bonuses"}
            {step === 3 && "Select 3 or more areas you want to focus on"}
            {step === 4 && "How much time can you dedicate daily?"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="text-6xl animate-bounce">⚔️</div>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Your Life is an RPG</h3>
                <p className="text-muted-foreground">
                  Turn everyday actions into adventures. Complete quests, earn XP, 
                  level up across 7 life dimensions, and become the hero of your story.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="text-sm font-medium">Track Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-sm font-medium">Earn Achievements</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🔥</div>
                    <div className="text-sm font-medium">Build Streaks</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Class Selection */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classes.map((charClass) => (
                <div
                  key={charClass.id}
                  onClick={() => setSelectedClass(charClass.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedClass === charClass.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{charClass.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{charClass.name}</div>
                      <p className="text-sm text-muted-foreground mt-1">{charClass.description}</p>
                      {charClass.primary_area && (
                        <div className="mt-2 text-xs text-primary">
                          +5% XP in {charClass.primary_area}
                          {charClass.secondary_area && ` & ${charClass.secondary_area}`}
                        </div>
                      )}
                      {!charClass.primary_area && (
                        <div className="mt-2 text-xs text-primary">
                          Balanced bonuses across all areas
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Focus Areas */}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LIFE_AREAS.map((area) => (
                <div
                  key={area.id}
                  onClick={() => toggleArea(area.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedAreas.includes(area.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selectedAreas.includes(area.id)} />
                    <div className="text-2xl">{area.emoji}</div>
                    <div>
                      <div className="font-medium">{area.name}</div>
                      <div className="text-sm text-muted-foreground">{area.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Commitment Level */}
          {step === 4 && (
            <div className="space-y-3">
              {COMMITMENT_LEVELS.map((level) => (
                <div
                  key={level.id}
                  onClick={() => setCommitment(level.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    commitment === level.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">{level.name}</div>
                      <div className="text-sm text-muted-foreground">{level.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">{level.time}</div>
                      <div className="text-xs text-muted-foreground">Goal: {level.xpGoal}/day</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={step === 2 && !selectedClass}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={loading || selectedAreas.length < 3}
              >
                <Check className="w-4 h-4 mr-2" />
                {loading ? "Starting..." : "Begin Adventure!"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
