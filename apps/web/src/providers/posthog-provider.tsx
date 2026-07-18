"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { publicEnv } from "@/lib/env.public";

const enabled = Boolean(publicEnv.NEXT_PUBLIC_POSTHOG_KEY);

if (enabled && typeof window !== "undefined") {
  posthog.init(publicEnv.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: publicEnv.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: false,
    person_profiles: "identified_only",
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    if (!enabled) return;
    const url = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {enabled && (
        <React.Suspense fallback={null}>
          <PageviewTracker />
        </React.Suspense>
      )}
      {children}
    </>
  );
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!enabled) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!enabled) return;
  posthog.identify(userId, properties);
}
