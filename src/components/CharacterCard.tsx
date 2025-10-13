import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgressBar } from "./ProgressBar";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CharacterCardProps {
  name: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  totalXp: number;
}

export const CharacterCard = ({ 
  name, 
  level, 
  currentXp, 
  nextLevelXp,
  totalXp 
}: CharacterCardProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Safe travels, adventurer!");
    navigate("/auth");
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-secondary border-primary/20 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary animate-glow-pulse">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{name}</h2>
              <p className="text-sm text-muted-foreground">Level {level} Adventurer</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-secondary/50 p-3 rounded-lg border border-border/30">
            <p className="text-3xl font-bold text-gold">{level}</p>
            <p className="text-xs text-muted-foreground">Level</p>
          </div>
          <div className="bg-secondary/50 p-3 rounded-lg border border-border/30">
            <p className="text-3xl font-bold text-xp">{totalXp}</p>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
          <div className="bg-secondary/50 p-3 rounded-lg border border-border/30">
            <p className="text-3xl font-bold text-emerald">{Math.round((currentXp / nextLevelXp) * 100)}%</p>
            <p className="text-xs text-muted-foreground">Progress</p>
          </div>
        </div>
        
        <ProgressBar
          current={currentXp}
          max={nextLevelXp}
          label="Experience to Next Level"
          color="xp"
        />

        <div className="bg-secondary/30 p-4 rounded-lg border border-border/30 text-center">
          <p className="text-sm text-muted-foreground mb-1">Daily Quest Reminder</p>
          <p className="text-lg font-semibold text-foreground">
            Complete 5 activities today to level up faster!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
