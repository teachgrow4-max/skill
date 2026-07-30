"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Coins,
  Compass,
  Film,
  Home,
  LayoutDashboard,
  MessageCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "@skilltego/utils";
import type { NavLinkItem } from "./app-nav-items";
import { SidebarLabel } from "./sidebar-label";

const ICONS = {
  home: Home,
  explore: Compass,
  reels: Film,
  opportunities: Sparkles,
  messages: MessageCircle,
  skillCoins: Coins,
  leaderboard: Trophy,
  dashboard: LayoutDashboard,
  moderation: Shield,
  admin: ShieldCheck,
};

export function NavLink({ item, unreadDot }: { item: NavLinkItem; unreadDot?: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = ICONS[item.icon];

  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-accent text-foreground shadow-[0_0_0_1px_#d9d9d926,0_4px_16px_#d9d9d91a]"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <span className="relative">
        <Icon className={cn("size-6", active && "text-primary")} strokeWidth={active ? 2.4 : 2} />
        {unreadDot && (
          <motion.span
            className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          />
        )}
      </span>
      <SidebarLabel>{item.label}</SidebarLabel>
    </Link>
  );
}
