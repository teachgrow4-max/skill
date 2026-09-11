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
// TEMPORARY: on-screen debug trail — this device's WebView console isn't
// visible via logcat, same technique proven earlier in this project. Remove
// once the "stuck on /login after returning from Chrome" bug is confirmed fixed.
function debugLine(text: string) {
  let el = document.getElementById("__native_oauth_debug__");
  if (!el) {
    el = document.createElement("div");
    el.id = "__native_oauth_debug__";
    el.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#c00;color:#fff;font:11px monospace;padding:6px;white-space:pre-wrap;max-height:40vh;overflow:auto;";
    document.body.appendChild(el);
  }
  el.textContent += `${new Date().toISOString().slice(11, 19)} ${text}\n`;
}

export function NativeOAuthCallback() {
  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    debugLine(`mounted, registering listener`);

    const listenerPromise = CapacitorApp.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
      debugLine(`appUrlOpen RAW: ${event.url}`);
      void (async () => {
        try {
          const url = new URL(event.url);
          debugLine(`parsed host="${url.host}" search="${url.search}"`);
          const code = url.searchParams.get("code");
          debugLine(`code present: ${Boolean(code)}`);
          if (!code) {
            debugLine(`STOPPING — no code in URL`);
            return;
          }

          const redirectTo = localStorage.getItem(NATIVE_OAUTH_REDIRECT_STORAGE_KEY) ?? "/feed";
          debugLine(`redirectTo: ${redirectTo}`);
          localStorage.removeItem(NATIVE_OAUTH_REDIRECT_STORAGE_KEY);
          const supabase = createClient();
          debugLine(`exchanging code...`);
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          debugLine(`exchange error: ${error?.message ?? "none"}`);
          const dest = error ? "/auth/auth-code-error" : redirectTo;
          debugLine(`navigating to ${dest}`);
          window.location.href = dest;
        } catch (err) {
          debugLine(`THREW: ${err instanceof Error ? err.message : String(err)}`);
          window.location.href = "/auth/auth-code-error";
        }
      })();
    });

    listenerPromise.then(
      () => debugLine(`listener registered ok`),
      (err) => debugLine(`listener registration FAILED: ${err instanceof Error ? err.message : String(err)}`),
    );

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, []);

  return null;
}
