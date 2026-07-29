"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "lucide-react";
import { recordDailyActivityAction } from "../actions";

export function DailyCheckIn() {
  const [result, setResult] = React.useState<{ streak: number; coinsAwarded: number } | null>(null);

  React.useEffect(() => {
    recordDailyActivityAction().then((data) => {
      if (data && data.coinsAwarded > 0) setResult(data);
    });
  }, []);

  React.useEffect(() => {
    if (result === null) return;
    const timeout = window.setTimeout(() => setResult(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [result]);

  return (
    <AnimatePresence>
      {result !== null && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="gradient-brand fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-glow-orange"
        >
          <Flame className="size-4" />+{result.coinsAwarded} Skill Coins
          {result.streak > 1 ? ` — ${result.streak}-day streak! Keep it up.` : " — Daily login bonus."}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
