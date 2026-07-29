"use client";

import { motion } from "framer-motion";
import {
  Coins,
  Flame,
  Gift,
  GraduationCap,
  Heart,
  ShoppingBag,
  Star,
  Ticket,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@skilltego/ui";
import { siteConfig } from "@skilltego/config";
import { scrollToId } from "../lib/scroll-to-id";

const EARN_METHODS = [
  { icon: Gift, title: `Create your ${siteConfig.name} account`, subtitle: "+5 Skill Coins" },
  { icon: Video, title: "Post your first reel", subtitle: "+25 Skill Coins" },
  { icon: Users, title: "Invite a friend", subtitle: "+20 Skill Coins for every successful referral" },
  { icon: Flame, title: "Maintain your daily login streak", subtitle: "Earn bonus Skill Coins" },
  { icon: Trophy, title: "Complete achievements", subtitle: "Unlock additional Skill Coins" },
  {
    icon: Heart,
    title: `Be active on ${siteConfig.name}`,
    subtitle: "More activities and challenges will reward Skill Coins over time",
  },
];

const FUTURE_REWARDS = [
  { icon: ShoppingBag, label: "Shopping discounts" },
  { icon: Gift, label: "Exclusive merchandise" },
  { icon: Star, label: `Premium ${siteConfig.name} features` },
  { icon: GraduationCap, label: "Learning resources" },
  { icon: Ticket, label: "Special platform rewards" },
];

export function SkillCoinsInfoCard() {
  return (
    <div className="glass mt-6 overflow-hidden rounded-2xl shadow-sm">
      <div className="gradient-brand relative overflow-hidden p-6 text-white sm:p-8">
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
        <div className="relative flex items-center gap-3">
          <motion.span
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl shadow-glow"
          >
            🪙
          </motion.span>
          <h2 className="text-lg font-bold sm:text-xl">What are Skill Coins?</h2>
        </div>
        <p className="relative mt-3 text-sm text-white/90">
          Skill Coins are the official rewards currency of {siteConfig.name}. Complete activities across the
          platform to earn coins, increase your level, unlock achievements, and prepare for exciting future
          rewards.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <h3 className="text-sm font-semibold text-foreground">Ways to earn Skill Coins</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {EARN_METHODS.map((method) => (
            <div
              key={method.title}
              className="flex items-start gap-2.5 rounded-xl border border-border p-3 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <method.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">{method.title}</p>
                <p className="text-xs text-muted-foreground">{method.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-accent/30 p-4">
          <h3 className="text-sm font-semibold text-foreground">💰 Why collect Skill Coins?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Skill Coins are planned to become redeemable in the future for exciting rewards such as:
          </p>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {FUTURE_REWARDS.map((reward) => (
              <li key={reward.label} className="flex items-center gap-2">
                <reward.icon className="size-4 shrink-0 text-primary" />
                {reward.label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Note: These redemption features are planned for a future release and are not yet available.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => scrollToId("rewards-rules-list")}
            className="gradient-brand rounded-full text-white shadow-glow transition-transform hover:-translate-y-0.5 hover:shadow-glow-orange"
          >
            <Coins className="size-4" />
            Earn More Coins
          </Button>
          <Button onClick={() => scrollToId("referral-card")} variant="outline" className="rounded-full">
            <Users className="size-4" />
            Invite Friends
          </Button>
        </div>
      </div>
    </div>
  );
}
