"use client";

import * as React from "react";
import { Capacitor } from "@capacitor/core";
import { signInWithOAuth, type OAuthProvider } from "@skilltego/auth";
import { Button } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/browser";
import { NATIVE_OAUTH_REDIRECT_STORAGE_KEY } from "@/providers/native-oauth-callback";

// Must match the intent-filter scheme in AndroidManifest.xml and be registered
// as a Redirect URL in the Supabase dashboard, exactly, with no query string —
// see native-oauth-callback.tsx for why the redirect target isn't passed as a
// query param here.
const NATIVE_OAUTH_SCHEME = "teachgrow.skilltego.com";

// TEMPORARY: on-screen debug trail, same technique as native-oauth-callback.tsx
// used earlier — this device's WebView console isn't visible via logcat.
// Remove once the "Continue with Google" stuck-on-Redirecting bug is confirmed fixed.
function debugLine(text: string) {
  let el = document.getElementById("__oauth_debug__");
  if (!el) {
    el = document.createElement("div");
    el.id = "__oauth_debug__";
    el.style.cssText =
      "position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#06c;color:#fff;font:11px monospace;padding:6px;white-space:pre-wrap;max-height:40vh;overflow:auto;";
    document.body.appendChild(el);
  }
  el.textContent += `${new Date().toISOString().slice(11, 19)} ${text}\n`;
}

const PROVIDERS: { id: OAuthProvider; label: string; icon: React.ReactNode }[] = [
  {
    id: "google",
    label: "Continue with Google",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden className="size-4">
        <path
          fill="#4285F4"
          d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.1Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.62l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
        />
      </svg>
    ),
  },
];

export function OAuthButtons({ redirectTo = "/feed" }: { redirectTo?: string }) {
  const [loadingProvider, setLoadingProvider] = React.useState<OAuthProvider | null>(null);

  async function handleClick(provider: OAuthProvider) {
    debugLine(`click: ${provider}`);
    setLoadingProvider(provider);
    const supabase = createClient();
    const isNative = Capacitor.isNativePlatform();
    debugLine(`isNative: ${isNative}`);
    if (isNative) {
      localStorage.setItem(NATIVE_OAUTH_REDIRECT_STORAGE_KEY, redirectTo);
    }
    const callbackUrl = isNative
      ? `${NATIVE_OAUTH_SCHEME}://auth-callback`
      : `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;
    debugLine(`callbackUrl: ${callbackUrl}`);
    const { data, error } = await signInWithOAuth(supabase, provider, callbackUrl);
    debugLine(`error: ${error?.message ?? "none"}`);
    debugLine(`data.url: ${data?.url ?? "none"}`);
    if (error) {
      setLoadingProvider(null);
      return;
    }
    if (data?.url) {
      debugLine(`navigating...`);
      window.location.href = data.url;
    } else {
      debugLine(`NO URL RETURNED — nothing to navigate to`);
    }
  }

  return (
    <div className="grid gap-2">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="w-full"
          disabled={loadingProvider !== null}
          onClick={() => handleClick(provider.id)}
        >
          {provider.icon}
          {loadingProvider === provider.id ? "Redirecting…" : provider.label}
        </Button>
      ))}
    </div>
  );
}
