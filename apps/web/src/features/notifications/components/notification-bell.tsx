"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@skilltego/ui";
import { useNotifications } from "@/providers/notifications-provider";

export function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Button type="button" variant="ghost" size="icon" asChild aria-label="Notifications" className="relative">
      <Link href="/notifications">
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
