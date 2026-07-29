"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@skilltego/utils";

export interface CoinToastData {
  icon: string;
  title: string;
  subtitle: string;
}

interface CoinToastProps {
  toast: CoinToastData | null;
  className?: string;
}

export function CoinToast({ toast, className }: CoinToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          className={cn(
            "gradient-brand fixed left-1/2 top-4 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl px-4 py-3 text-white shadow-glow-orange",
            className,
          )}
        >
          <span className="text-2xl leading-none">{toast.icon}</span>
          <div className="text-left">
            <p className="text-sm font-bold leading-tight">{toast.title}</p>
            <p className="text-xs leading-tight text-white/90">{toast.subtitle}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
