"use server";

import {
  getNotifications,
  getProfilesByIds,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  toAuthorSummary,
  toNotification,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@skilltego/types";

export async function getNotificationsAction(): Promise<{
  notifications: Notification[];
  unreadCount: number;
  userId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { notifications: [], unreadCount: 0, userId: null };

  const [rows, unreadCount] = await Promise.all([
    getNotifications(supabase, user.id),
    getUnreadNotificationCount(supabase, user.id),
  ]);

  const actorIds = [...new Set(rows.map((row) => row.actor_id))];
  const actors = await getProfilesByIds(supabase, actorIds);
  const actorMap = new Map(actors.map((actor) => [actor.id, toAuthorSummary(actor)]));

  const notifications = rows
    .filter((row) => actorMap.has(row.actor_id))
    .map((row) => toNotification(row, actorMap.get(row.actor_id)!));

  return { notifications, unreadCount, userId: user.id };
}

export async function markNotificationReadAction(notificationId: string): Promise<void> {
  const supabase = await createClient();
  await markNotificationRead(supabase, notificationId);
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await markAllNotificationsRead(supabase, user.id);
}
