"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Coins, Gift, Trophy, Users, X } from "lucide-react";
import { Button } from "@skilltego/ui";
import { scrollToId } from "../lib/scroll-to-id";

const DISMISS_KEY = "skilltego_rewards_banner_dismissed";

export function RewardsBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(window.localStorage.getItem(DISMISS_KEY) !== "1");
  }, []);

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="gradient-hero relative mt-6 overflow-hidden rounded-2xl p-6 text-white shadow-glow-burgundy sm:p-8"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss rewards announcement"
        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
      >
        <X className="size-4" />
      </button>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(circle at 100% 0%, black, transparent 65%)",
          WebkitMaskImage: "radial-gradient(circle at 100% 0%, black, transparent 65%)",
        }}
      />

      <div className="relative grid gap-4 pr-8">
        <div className="flex items-center gap-3">
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl shadow-glow"
          >
            🪙
          </motion.span>
          <div>
            <h2 className="text-lg font-bold sm:text-xl">🚀 SkillTego Rewards Program is Here!</h2>
            <p className="text-sm text-white/85">
              Start earning SkillCoins today and unlock exciting rewards!
            </p>
          </div>
        </div>

        <ul className="grid gap-2 text-sm text-white/90 sm:grid-cols-3">
          <li className="flex items-center gap-2 rounded-xl bg-white/10 p-3">
            <Gift className="size-4 shrink-0" />
            <span>
              🎁 Create your account and receive <strong>5 SkillCoins</strong> instantly.
            </span>
          </li>
          <li className="flex items-center gap-2 rounded-xl bg-white/10 p-3">
            <Trophy className="size-4 shrink-0" />
            <span>
              🎥 Post your first reel and earn an additional <strong>25 SkillCoins</strong>.
            </span>
          </li>
          <li className="flex items-center gap-2 rounded-xl bg-white/10 p-3">
            <Users className="size-4 shrink-0" />
            <span>
              👥 Refer your friends and receive <strong>20 SkillCoins</strong> for every successful referral.
            </span>
          </li>
        </ul>

        <div className="rounded-xl bg-white/10 p-3 text-sm text-white/90">
          💰 <strong>The future of SkillCoins is coming!</strong> Within the next 3–6 months, SkillCoins are
          planned to gain real value and will be redeemable for shopping, premium features, and exclusive
          rewards on the SkillTego platform.
        </div>

        <p className="text-sm font-medium text-white/95">
          🌟 Don&apos;t miss this opportunity! Start collecting SkillCoins today, grow your rewards, and
          prepare to unlock exciting opportunities within the SkillTego ecosystem.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => scrollToId("skill-coins-card")}
            className="rounded-full bg-white text-primary shadow-glow transition-transform hover:-translate-y-0.5 hover:bg-white/90"
          >
            <Coins className="size-4" />
            Start Earning
          </Button>
          <Button
            onClick={() => scrollToId("referral-card")}
            variant="outline"
            className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
          >
            <Users className="size-4" />
            Invite Friends
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
