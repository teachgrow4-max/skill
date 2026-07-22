"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Film, Home, Sparkles } from "lucide-react";
import { cn } from "@skilltego/utils";

const TABS = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/reels", label: "Reels", icon: Film },
  { href: "/opportunities", label: "Opportunities", icon: Sparkles },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/90 py-2 backdrop-blur-xl md:hidden">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <tab.icon className="size-6" strokeWidth={active ? 2.4 : 2} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
