"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@skilltego/ui";

// Catches anything that throws while rendering a page outside the app shell
// (marketing, auth, onboarding). Pages inside the shell use (app)/error.tsx,
// which keeps the sidebar and bottom nav usable.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <EmptyState
        icon={<AlertTriangle className="size-7" />}
        title="Something went wrong"
        description="This is usually a temporary hiccup. Try again, or head back home."
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
