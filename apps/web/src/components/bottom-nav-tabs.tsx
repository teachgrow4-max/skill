"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Film, Home, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";

const TABS = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/reels", label: "Reels", icon: Film },
  { href: "/opportunities", label: "Opportunities", icon: Sparkles },
];

interface BottomNavTabsProps {
  username: string | null;
  fullName: string;
  avatarUrl: string | null;
}

export function BottomNavTabs({ username, fullName, avatarUrl }: BottomNavTabsProps) {
  const pathname = usePathname();
  const profileHref = username ? `/profile/${username}` : null;
  const profileActive =
    profileHref !== null && (pathname === profileHref || pathname.startsWith(`${profileHref}/`));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background/90 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
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
      {profileHref && (
        <Link
          href={profileHref}
          className={cn(
            "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
            profileActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Avatar
            className={cn(
              "size-6 rounded-full ring-2 ring-offset-1 ring-offset-background",
              profileActive ? "ring-primary" : "ring-transparent",
            )}
          >
            <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="text-[8px]">{initials(fullName)}</AvatarFallback>
          </Avatar>
          Profile
        </Link>
      )}
    </nav>
  );
}
