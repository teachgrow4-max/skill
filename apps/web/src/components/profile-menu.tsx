"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bookmark,
  FileText,
  HelpCircle,
  Lock,
  Pencil,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@skilltego/ui";
import { cn, initials } from "@skilltego/utils";
import { LogoutButton } from "./logout-button";

interface ProfileMenuProps {
  username: string;
  fullName: string;
  avatarUrl: string | null;
  align?: "start" | "center" | "end";
  className?: string;
}

export function ProfileMenu({ username, fullName, avatarUrl, align = "end", className }: ProfileMenuProps) {
  const [open, setOpen] = React.useState(false);

  const links = [
    { href: `/profile/${username}`, label: "My Profile", icon: User },
    { href: "/profile/edit", label: "Edit Profile", icon: Pencil },
    { href: "/bookmarks", label: "Saved Posts", icon: Bookmark },
    { href: "/opportunities/mine", label: "My Opportunities", icon: Sparkles },
    { href: "/profile/drafts", label: "Drafts", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/settings/privacy", label: "Privacy", icon: Lock },
    { href: "/help", label: "Help & Support", icon: HelpCircle },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Open profile menu"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            className,
          )}
        >
          <Avatar className="size-8 md:size-6">
            <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="text-[10px]">{initials(fullName)}</AvatarFallback>
          </Avatar>
          <span className="hidden truncate xl:inline">{fullName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-64 border border-border shadow-lg"
        style={{ background: "var(--color-popover)", backdropFilter: "none", WebkitBackdropFilter: "none" }}
      >
        <div className="grid gap-0.5">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              <item.icon className="size-4 text-muted-foreground" />
              {item.label}
            </Link>
          ))}
          <Separator className="my-1" />
          <div onClick={() => setOpen(false)}>
            <LogoutButton />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
