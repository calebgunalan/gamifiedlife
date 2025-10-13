import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "./ProgressBar";
import { 
  Activity, 
  Brain, 
  Briefcase, 
  Users, 
  DollarSign, 
  Sparkles, 
  Heart 
} from "lucide-react";
import { LucideIcon } from "lucide-react";

interface SkillTreeProps {
  area: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  weeklyXp: number;
  weeklyTarget: number;
}

const areaIcons: Record<string, LucideIcon> = {
  physical: Activity,
  mental: Brain,
  productivity: Briefcase,
  social: Users,
  financial: DollarSign,
  personal: Sparkles,
  spiritual: Heart,
};

const areaNames: Record<string, string> = {
  physical: "Physical Health",
  mental: "Mental Development",
  productivity: "Productivity",
  social: "Social & Relationships",
  financial: "Financial Prosperity",
  personal: "Personal Growth",
  spiritual: "Spiritual Connection",
};

const areaColors: Record<string, "emerald" | "amethyst" | "xp" | "gold" | "ruby"> = {
  physical: "emerald",
  mental: "amethyst",
  productivity: "xp",
  social: "gold",
  financial: "gold",
  personal: "ruby",
  spiritual: "emerald",
};

export const SkillTree = ({ 
  area, 
  level, 
  currentXp, 
  nextLevelXp,
  weeklyXp,
  weeklyTarget 
}: SkillTreeProps) => {
  const Icon = areaIcons[area] || Activity;
  const isWeeklyTargetMet = weeklyXp >= weeklyTarget;

  return (
    <Card className="hover:border-primary/30 transition-all duration-300 group">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary group-hover:animate-glow-pulse" />
            <span>{areaNames[area]}</span>
          </div>
          <span className="text-2xl font-bold text-gold">
            {level}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ProgressBar
          current={currentXp}
          max={nextLevelXp}
          label="Level Progress"
          color={areaColors[area]}
          showPercentage
        />
        <div className="pt-2 border-t border-border/50">
          <ProgressBar
            current={weeklyXp}
            max={weeklyTarget}
            label="Weekly Target"
            color={isWeeklyTargetMet ? "gold" : "xp"}
            showPercentage
          />
          {isWeeklyTargetMet && (
            <p className="text-xs text-gold text-center mt-2 animate-fade-in">
              ✨ Weekly target achieved!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
