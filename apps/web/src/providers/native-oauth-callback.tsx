"use client";

import * as React from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp, type URLOpenListenerEvent } from "@capacitor/app";
import { createClient } from "@/lib/supabase/browser";

// Read back in the appUrlOpen handler below. The page the user should land on
// after sign-in isn't passed as a query param on the OAuth redirect URL — that
// URL must match a Supabase "Redirect URL" allow-list entry exactly (no query
// string), so any variation there (redirectTo=/feed vs /onboarding, etc.) was
// silently rejected and Supabase fell back to the Site URL, stranding the user
// on the plain website instead of returning to the app.
export const NATIVE_OAUTH_REDIRECT_STORAGE_KEY = "skilltego:native-oauth-redirect-to";

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

      const redirectTo = localStorage.getItem(NATIVE_OAUTH_REDIRECT_STORAGE_KEY) ?? "/feed";
      localStorage.removeItem(NATIVE_OAUTH_REDIRECT_STORAGE_KEY);
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
