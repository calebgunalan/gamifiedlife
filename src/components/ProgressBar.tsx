import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  color?: "xp" | "gold" | "emerald" | "ruby" | "amethyst";
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar = ({ 
  current, 
  max, 
  label, 
  color = "xp",
  showPercentage = false,
  className 
}: ProgressBarProps) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  const colorClasses = {
    xp: "bg-xp",
    gold: "bg-gold",
    emerald: "bg-emerald",
    ruby: "bg-ruby",
    amethyst: "bg-amethyst",
  };

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-foreground">{label}</span>
          {showPercentage && (
            <span className="text-muted-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className="h-3 bg-secondary rounded-full overflow-hidden border border-border/30">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out animate-xp-fill",
            colorClasses[color],
            percentage > 0 && "shadow-[0_0_10px_currentColor]"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{current}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};
