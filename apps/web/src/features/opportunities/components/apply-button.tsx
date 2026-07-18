"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "@skilltego/ui";
import { applyToOpportunityAction } from "../actions";

interface ApplyButtonProps {
  opportunityId: string;
  isLoggedIn: boolean;
  hasApplied: boolean;
  isOwner: boolean;
  isClosed: boolean;
  actionLabel: string;
}

export function ApplyButton({ opportunityId, isLoggedIn, hasApplied, isOwner, isClosed, actionLabel }: ApplyButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [coverNote, setCoverNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [applied, setApplied] = React.useState(hasApplied);
  const [error, setError] = React.useState<string | null>(null);

  if (isOwner) return null;

  if (applied) {
    return <p className="text-sm font-medium text-success">You&apos;ve applied to this one.</p>;
  }

  if (isClosed) {
    return (
      <Button disabled variant="outline">
        Closed
      </Button>
    );
  }

  function handleOpen() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await applyToOpportunityAction(opportunityId, coverNote);
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not submit.");
      return;
    }
    setApplied(true);
  }

  if (!open) {
    return <Button onClick={handleOpen}>{actionLabel}</Button>;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2">
      <Textarea
        placeholder="Add a short note (optional)"
        rows={3}
        value={coverNote}
        onChange={(e) => setCoverNote(e.target.value)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
