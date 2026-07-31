"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Lock, MessageCircle, Reply, UserCheck, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, EmptyState } from "@skilltego/ui";
import { cn, initials, formatRelativeTime } from "@skilltego/utils";
import type { Notification } from "@skilltego/types";
import { getNotificationsAction, markAllNotificationsReadAction, markNotificationReadAction } from "../actions";
import { useNotificationDeleteSync } from "../hooks/use-notification-delete-sync";

const ICONS = {
  follow: UserPlus,
  like: Heart,
  comment: MessageCircle,
  reply: Reply,
  follow_request: Lock,
  follow_accepted: UserCheck,
} as const;

const LABELS: Record<Notification["type"], string> = {
  follow: "started following you",
  like: "liked your post",
  comment: "commented on your post",
  reply: "replied to your comment",
  follow_request: "requested to follow you",
  follow_accepted: "accepted your follow request",
};

function targetHref(notification: Notification): string {
  if (notification.type === "follow" || notification.type === "follow_accepted") {
    return `/profile/${notification.actor.username}`;
  }
  if (notification.type === "follow_request") return "/follow-requests";
  return "/feed";
}

export function NotificationsList() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    getNotificationsAction().then(({ notifications: data, unreadCount: count, userId: id }) => {
      setNotifications(data);
      setUnreadCount(count);
      setUserId(id);
      setLoaded(true);
    });
  }, []);

  const handleDeleted = React.useCallback((id: string) => {
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      if (!removed) return prev;
      if (!removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.filter((n) => n.id !== id);
    });
  }, []);

  useNotificationDeleteSync(userId, handleDeleted);

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
  }

  if (loaded && notifications.length === 0) {
    return <EmptyState title="No notifications yet" description="Likes, comments, and follows will show up here." />;
  }

  return (
    <div className="grid gap-1">
      {unreadCount > 0 && (
        <div className="flex justify-end pb-2">
          <button type="button" onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
            Mark all read
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {notifications.map((notification) => {
          const Icon = ICONS[notification.type];
          return (
            <motion.div
              key={notification.id}
              layout
              initial={false}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <Link
                href={targetHref(notification)}
                onClick={() => handleClickNotification(notification)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border p-3 text-sm hover:bg-accent/50",
                  !notification.isRead && "bg-accent/20",
                )}
              >
                <Avatar className="size-10">
                  <AvatarImage
                    src={notification.actor.avatarUrl ?? undefined}
                    alt={notification.actor.fullName}
                  />
                  <AvatarFallback>{initials(notification.actor.fullName)}</AvatarFallback>
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
                <Icon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
