"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, Reply, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@skilltego/ui";
import { cn, initials, formatRelativeTime } from "@skilltego/utils";
import type { Notification } from "@skilltego/types";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../actions";

const ICONS = {
  follow: UserPlus,
  like: Heart,
  comment: MessageCircle,
  reply: Reply,
} as const;

const LABELS: Record<Notification["type"], string> = {
  follow: "started following you",
  like: "liked your post",
  comment: "commented on your post",
  reply: "replied to your comment",
};

function targetHref(notification: Notification): string {
  if (notification.type === "follow") return `/profile/${notification.actor.username}`;
  return "/feed";
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    getNotificationsAction().then(({ notifications: data, unreadCount: count }) => {
      setNotifications(data);
      setUnreadCount(count);
    });
  }, []);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!loaded) {
      const { notifications: data, unreadCount: count } = await getNotificationsAction();
      setNotifications(data);
      setUnreadCount(count);
      setLoaded(true);
    }
  }

  async function handleMarkAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsReadAction();
  }

  async function handleClickNotification(notification: Notification) {
    if (!notification.isRead) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationReadAction(notification.id);
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-11 z-50 max-h-96 w-80 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}

          {notifications.map((notification) => {
            const Icon = ICONS[notification.type];
            return (
              <Link
                key={notification.id}
                href={targetHref(notification)}
                onClick={() => handleClickNotification(notification)}
                className={cn(
                  "flex items-start gap-2.5 border-b border-border p-3 text-sm hover:bg-accent/50",
                  !notification.isRead && "bg-accent/20",
                )}
              >
                <Avatar className="size-8">
                  <AvatarImage
                    src={notification.actor.avatarUrl ?? undefined}
                    alt={notification.actor.fullName}
                  />
                  <AvatarFallback className="text-xs">{initials(notification.actor.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p>
                    <span className="font-medium">{notification.actor.fullName}</span>{" "}
                    {LABELS[notification.type]}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
                <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
