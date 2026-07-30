"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resendVerificationEmail } from "@skilltego/auth";
import { Button, Input } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/browser";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function VerifyEmailPanel({ email }: { email: string | null }) {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = React.useState(email);
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftEmail, setDraftEmail] = React.useState(email ?? "");
  const [editError, setEditError] = React.useState<string | null>(null);

  async function handleResend(targetEmail: string) {
    setStatus("sending");
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/onboarding")}`;
    const { error } = await resendVerificationEmail(supabase, targetEmail, emailRedirectTo);
    setStatus(error ? "error" : "sent");
  }

  function handleStartEdit() {
    setDraftEmail(currentEmail ?? "");
    setEditError(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditError(null);
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draftEmail.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setEditError("Enter a valid email address.");
      return;
    }
    setCurrentEmail(trimmed);
    setIsEditing(false);
    setEditError(null);
    setStatus("idle");
    router.replace(`/verify-email?email=${encodeURIComponent(trimmed)}`);
    void handleResend(trimmed);
  }

  return (
    <div className="grid gap-4 text-center">
      <h1 className="text-xl font-semibold">Verify your email</h1>

      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="grid gap-2 text-left">
          <p className="text-sm text-muted-foreground text-center">Enter the correct email address.</p>
          <Input
            type="email"
            autoComplete="email"
            autoFocus
            value={draftEmail}
            onChange={(e) => setDraftEmail(e.target.value)}
          />
          {editError && <p className="text-xs text-destructive">{editError}</p>}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Save &amp; resend
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={handleCancelEdit}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification link to{" "}
          <span className="font-medium text-foreground">{currentEmail ?? "your email address"}</span>. Click
          it to activate your Skilltego account.{" "}
          <button
            type="button"
            onClick={handleStartEdit}
            className="font-medium text-primary hover:underline"
          >
            Edit email
          </button>
        </p>
      )}

      {!isEditing && currentEmail && (
        <Button
          type="button"
          variant="outline"
          onClick={() => handleResend(currentEmail)}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending…" : status === "sent" ? "Email sent" : "Resend email"}
        </Button>
      )}
      {status === "error" && (
        <p className="text-xs text-destructive">Couldn&apos;t resend right now — try again shortly.</p>
      )}

      <Link href="/login" className="text-sm font-medium text-primary hover:underline">
        Back to login
      </Link>
    </div>
  );
}
