import "server-only";
import webpush from "web-push";
import { getPushSubscriptionsForUser, removePushSubscription } from "@skilltego/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@skilltego/types";
import { publicEnv } from "@/lib/env.public";
import { serverEnv } from "@/lib/env.server";

let configured = false;

function ensureConfigured(): boolean {
  if (!publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !serverEnv.VAPID_PRIVATE_KEY) return false;
  if (!configured) {
    webpush.setVapidDetails(
      "mailto:support@skilltego.com",
      publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      serverEnv.VAPID_PRIVATE_KEY,
    );
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** Best-effort — never throws, so a push failure never breaks the calling action. */
export async function sendPushToUser(
  client: SupabaseClient<Database>,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureConfigured()) return;

  try {
    const subscriptions = await getPushSubscriptionsForUser(client, userId);
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await removePushSubscription(client, sub.endpoint).catch(() => {});
          }
        }
      }),
    );
  } catch {
    // Swallow — push notifications are a nice-to-have, never block the main action.
  }
}
