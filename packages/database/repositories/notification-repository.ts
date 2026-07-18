import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NotificationRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function getNotifications(
  client: Client,
  userId: string,
  limit = 30,
): Promise<NotificationRow[]> {
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUnreadNotificationCount(client: Client, userId: string): Promise<number> {
  const { count, error } = await client
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(client: Client, notificationId: string): Promise<void> {
  const { error } = await client.from("notifications").update({ is_read: true }).eq("id", notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(client: Client, userId: string): Promise<void> {
  const { error } = await client
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}
