"use client";

import * as React from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@skilltego/ui";
import { publicEnv } from "@/lib/env.public";
import { removePushSubscriptionAction, savePushSubscriptionAction } from "../actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationToggle() {
  const [supported, setSupported] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);

    navigator.serviceWorker.register("/sw.js").then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    });
  }, []);

  async function handleEnable() {
    setError(null);

    if (!publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      setError("Push notifications aren't configured yet — add VAPID keys to .env.local.");
      return;
    }

    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was denied.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY) as BufferSource,
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setError("Couldn't read the push subscription.");
        return;
      }

      const result = await savePushSubscriptionAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });

      if (!result.success) {
        setError(result.error ?? "Could not save subscription.");
        return;
      }
      setSubscribed(true);
    } catch {
      setError("Couldn't enable notifications on this device.");
    } finally {
      setPending(false);
    }
  }

  async function handleDisable() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setPending(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">Push notifications</p>
        <p className="text-xs text-muted-foreground">
          Get notified about likes, comments, follows, and messages on this device.
        </p>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={subscribed ? handleDisable : handleEnable}
      >
        {subscribed ? <BellOff className="size-3.5" /> : <Bell className="size-3.5" />}
        {subscribed ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}
