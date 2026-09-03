"use client";

import * as React from "react";
import type { Notification } from "@skilltego/types";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { useNotificationDeleteSync } from "@/features/notifications/hooks/use-notification-delete-sync";

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);

// The app shell mounts a bell in both the mobile top bar and the desktop
// sidebar simultaneously (visibility is CSS-only, not conditional), so each
// used to fetch getNotificationsAction() independently on every page load.
// One provider, fetched once, shared by both.
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    getNotificationsAction().then(({ notifications: data, unreadCount: count, userId: id }) => {
      setNotifications(data);
      setUnreadCount(count);
      setUserId(id);
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

  const markAllRead = React.useCallback(async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsReadAction();
  }, []);

  const markRead = React.useCallback(async (id: string) => {
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.isRead) setUnreadCount((c) => Math.max(0, c - 1));
      return prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    });
    await markNotificationReadAction(id);
  }, []);

  const value = React.useMemo(
    () => ({ notifications, unreadCount, markAllRead, markRead }),
    [notifications, unreadCount, markAllRead, markRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
