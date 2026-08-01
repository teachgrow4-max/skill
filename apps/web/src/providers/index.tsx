import * as React from "react";
import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { PostHogProvider } from "./posthog-provider";
import { ServiceWorkerRegister } from "./service-worker-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <PostHogProvider>
          <ServiceWorkerRegister />
          {children}
        </PostHogProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
