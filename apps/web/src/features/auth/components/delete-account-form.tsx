"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button, Input } from "@skilltego/ui";
import { deleteAccountAction } from "../actions";

export function DeleteAccountForm({ username }: { username: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const result = await deleteAccountAction();
    if (!result.success) {
      setError(result.error ?? "Could not delete your account.");
      setPending(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid gap-4 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="grid gap-1 text-sm">
          <p className="font-medium">This permanently deletes your account.</p>
          <p className="text-muted-foreground">
            Your profile, posts, messages, follows, and every other record tied to your account are removed
            immediately and cannot be recovered.
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="delete-confirm" className="text-sm font-medium">
          Type <span className="font-mono">{username}</span> to confirm
        </label>
        <Input
          id="delete-confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        variant="destructive"
        disabled={confirmation !== username || pending}
        onClick={handleDelete}
        className="w-fit"
      >
        {pending ? "Deleting…" : "Permanently delete my account"}
      </Button>
    </div>
  );
}
