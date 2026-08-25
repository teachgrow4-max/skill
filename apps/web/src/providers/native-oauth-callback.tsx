"use client";

import * as React from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp, type URLOpenListenerEvent } from "@capacitor/app";
import { createClient } from "@/lib/supabase/browser";

/**
 * Google's OAuth policy blocks completing sign-in inside an embedded WebView,
 * so the Android app hands off to Chrome for that step (see capacitor.config.ts's
 * allowNavigation — accounts.google.com isn't whitelisted, so Capacitor opens it
 * externally). OAuthButtons requests the custom-scheme redirect below for native
 * builds specifically so Android routes control back to this app afterward
 * instead of leaving the user signed in only inside Chrome. This listener catches
 * that return trip and finishes the PKCE exchange using the same WebView that
 * started it, since the code_verifier Supabase needs lives in its local storage.
 */
export function NativeOAuthCallback() {
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
      const url = new URL(event.url);
      const code = url.searchParams.get("code");
      if (!code) return;

      const redirectTo = url.searchParams.get("redirectTo") ?? "/feed";
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      window.location.href = error ? "/auth/auth-code-error" : redirectTo;
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, []);

  return null;
}
