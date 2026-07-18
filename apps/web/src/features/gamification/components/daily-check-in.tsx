"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { recordDailyActivityAction } from "../actions";

export function DailyCheckIn() {
  const [streak, setStreak] = React.useState<number | null>(null);

  React.useEffect(() => {
    recordDailyActivityAction().then((result) => {
      if (result && result.streak > 1) setStreak(result.streak);
    });
  }, []);

  React.useEffect(() => {
    if (streak === null) return;
    const timeout = window.setTimeout(() => setStreak(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [streak]);

  return (
    <AnimatePresence>
      {streak !== null && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="gradient-brand fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-glow"
        >
          <Flame className="size-4" />
          {streak}-day streak! Keep it up.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
