import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Gift, Snowflake, Star } from "lucide-react";

interface VariableRewardProps {
  show: boolean;
  rewardType: "bonus_xp" | "streak_freeze" | "rare_badge" | null;
  bonusAmount?: number;
  onComplete: () => void;
}

export function VariableReward({ show, rewardType, bonusAmount, onComplete }: VariableRewardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && rewardType) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, rewardType, onComplete]);

  const getRewardContent = () => {
    switch (rewardType) {
      case "bonus_xp":
        return {
          icon: <Sparkles className="w-12 h-12 text-xp" />,
          title: "BONUS XP!",
          description: `+${bonusAmount} bonus XP earned!`,
          gradient: "from-xp/20 to-gold/20"
        };
      case "streak_freeze":
        return {
          icon: <Snowflake className="w-12 h-12 text-sapphire" />,
          title: "STREAK FREEZE!",
          description: "You found a Streak Freeze token!",
          gradient: "from-sapphire/20 to-cyan-500/20"
        };
      case "rare_badge":
        return {
          icon: <Star className="w-12 h-12 text-gold" />,
          title: "RARE BADGE!",
          description: "You unlocked a rare badge!",
          gradient: "from-gold/20 to-amber-500/20"
        };
      default:
        return null;
    }
  };

  const content = getRewardContent();

  return (
    <AnimatePresence>
      {visible && content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            className={`relative p-8 rounded-2xl bg-gradient-to-br ${content.gradient} border-2 border-primary/30 shadow-2xl`}
          >
            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/40 rounded-full"
                  initial={{ 
                    x: "50%", 
                    y: "50%",
                    opacity: 0 
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>

            <div className="relative text-center space-y-4">
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 0.5
                }}
                className="mx-auto w-fit"
              >
                <Gift className="w-8 h-8 text-primary absolute -top-4 -right-4" />
                {content.icon}
              </motion.div>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold bg-gradient-to-r from-primary to-gold bg-clip-text text-transparent"
              >
                {content.title}
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-lg text-foreground/80"
              >
                {content.description}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Utility function to calculate variable rewards
export function calculateVariableReward(baseXP: number): {
  type: "bonus_xp" | "streak_freeze" | "rare_badge" | null;
  bonusXP: number;
} {
  const roll = Math.random();
  
  // 10% chance of bonus XP (1.5x-2x)
  if (roll < 0.10) {
    const multiplier = 1.5 + Math.random() * 0.5; // 1.5x to 2x
    return {
      type: "bonus_xp",
      bonusXP: Math.round(baseXP * multiplier) - baseXP
    };
  }
  
  // 5% chance of streak freeze
  if (roll < 0.15) {
    return {
      type: "streak_freeze",
      bonusXP: 0
    };
  }
  
  // 1% chance of rare badge
  if (roll < 0.16) {
    return {
      type: "rare_badge",
      bonusXP: 0
    };
  }
  
  return { type: null, bonusXP: 0 };
}
