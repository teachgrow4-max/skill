"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Lock, MessageCircle, Reply, UserCheck, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, EmptyState } from "@skilltego/ui";
import { cn, initials, formatRelativeTime } from "@skilltego/utils";
import type { Notification } from "@skilltego/types";
import { useNotifications } from "@/providers/notifications-provider";

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
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  async function handleClickNotification(notification: Notification) {
    if (!notification.isRead) {
      await markRead(notification.id);
    }
  }

  if (notifications.length === 0) {
    return <EmptyState title="No notifications yet" description="Likes, comments, and follows will show up here." />;
  }

  return (
    <div className="grid gap-2">
      {unreadCount > 0 && (
        <div className="flex justify-end pb-1">
          <button type="button" onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
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
                  "glass flex items-center gap-3 rounded-xl p-3 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow",
                  !notification.isRead && "border-primary/30",
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
                {!notification.isRead && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                <Icon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
