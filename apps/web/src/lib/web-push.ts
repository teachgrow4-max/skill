import "server-only";
import webpush from "web-push";
import { getPushSubscriptionsForUser, removePushSubscription } from "@skilltego/database";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * Best-effort — never throws, so a push failure never breaks the calling action.
 * Callers wrap this in after() so the push round-trip never delays their response.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) return;

  try {
    // Service-role client: this always runs as the *actor* (liker, commenter,
    // follower) to notify someone else, and push_subscriptions RLS only lets a
    // user read their own rows — with the actor's session the lookup returned
    // nothing and no push was ever delivered.
    const client = createAdminClient();
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
