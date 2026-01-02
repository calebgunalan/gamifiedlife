import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LevelUpCelebrationProps {
  show: boolean;
  level: number;
  area?: string;
  onComplete: () => void;
}

export function LevelUpCelebration({ show, level, area, onComplete }: LevelUpCelebrationProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (show) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setParticles(newParticles);

      // Auto-dismiss after animation
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onComplete}
        >
          {/* Confetti particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                top: "-10%", 
                left: `${particle.x}%`,
                opacity: 1,
                scale: 1 
              }}
              animate={{ 
                top: "110%",
                opacity: 0,
                scale: 0.5,
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration: 2 + Math.random(),
                delay: particle.delay,
                ease: "easeOut"
              }}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                backgroundColor: [
                  "hsl(var(--primary))",
                  "hsl(var(--gold))",
                  "hsl(var(--emerald))",
                  "hsl(var(--amethyst))",
                  "hsl(var(--ruby))",
                ][particle.id % 5],
              }}
            />
          ))}

          {/* Main celebration card */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", damping: 15 }}
            className="relative bg-card border-2 border-primary rounded-2xl p-8 shadow-2xl text-center max-w-sm mx-4"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-gold/20 rounded-2xl blur-xl" />
            
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-7xl mb-4"
              >
                🎉
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-primary mb-2"
              >
                LEVEL UP!
              </motion.h2>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                {area && (
                  <p className="text-muted-foreground capitalize">
                    {area.replace("_", " ")}
                  </p>
                )}
                <p className="text-5xl font-bold text-gold">
                  Level {level}
                </p>
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-muted-foreground text-sm"
              >
                Keep pushing forward, adventurer!
              </motion.p>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="mt-6 flex justify-center gap-2"
              >
                {[...Array(Math.min(level, 5))].map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="text-2xl"
                  >
                    ⭐
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
