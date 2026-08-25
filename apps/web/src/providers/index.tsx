import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { PostHogProvider } from "./posthog-provider";
import { ServiceWorkerRegister } from "./service-worker-register";
import { NativeOAuthCallback } from "./native-oauth-callback";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <PostHogProvider>
          <ServiceWorkerRegister />
          <NativeOAuthCallback />
          {children}
        </PostHogProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
