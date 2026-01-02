import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface XPNotificationProps {
  show: boolean;
  xp: number;
  message?: string;
  onComplete: () => void;
}

export function XPNotification({ show, xp, message, onComplete }: XPNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <div className="bg-card border border-primary/50 rounded-lg p-4 shadow-lg shadow-primary/20">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-3xl"
              >
                ✨
              </motion.div>
              <div>
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.3 }}
                  className="text-2xl font-bold text-xp"
                >
                  +{xp} XP
                </motion.p>
                {message && (
                  <p className="text-sm text-muted-foreground">{message}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
