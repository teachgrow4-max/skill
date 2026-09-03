"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@skilltego/ui";
import { updateAccountPrivacyAction } from "../actions";

export function PrivacyToggle({ initialIsPrivate }: { initialIsPrivate: boolean }) {
  const router = useRouter();
  const [isPrivate, setIsPrivate] = React.useState(initialIsPrivate);
  const [pending, setPending] = React.useState(false);

  async function handleChange(next: boolean) {
    setIsPrivate(next);
    setPending(true);
    const result = await updateAccountPrivacyAction(next);
    setPending(false);
    if (!result.success) {
      setIsPrivate(!next);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium">Private account</p>
        <p className="text-xs text-muted-foreground">Only approved followers can see your posts and stories.</p>
      </div>
      <Switch checked={isPrivate} disabled={pending} onCheckedChange={handleChange} />
    </div>
  );
}
