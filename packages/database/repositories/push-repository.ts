import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PushSubscriptionRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function savePushSubscription(
  client: Client,
  input: Database["public"]["Tables"]["push_subscriptions"]["Insert"],
): Promise<void> {
  const { error } = await client.from("push_subscriptions").upsert(input, { onConflict: "endpoint" });
  if (error) throw error;
}

export async function removePushSubscription(client: Client, endpoint: string): Promise<void> {
  const { error } = await client.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw error;
}

export async function getPushSubscriptionsForUser(
  client: Client,
  userId: string,
): Promise<PushSubscriptionRow[]> {
  const { data, error } = await client.from("push_subscriptions").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}
