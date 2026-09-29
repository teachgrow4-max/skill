"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button, EmptyState } from "@skilltego/ui";

// Renders inside the app shell, so the sidebar and bottom nav stay usable
// when a single page fails to load.
export default function AppError({
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
    <EmptyState
      className="mt-8"
      icon={<AlertTriangle className="size-7" />}
      title="Couldn't load this page"
      description="Check your connection and try again."
      action={
        <div className="flex gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/feed">Go to feed</Link>
          </Button>
        </div>
      }
    />
  );
}
