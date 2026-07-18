"use client";

import * as React from "react";
import Link from "next/link";
import { resendVerificationEmail } from "@skilltego/auth";
import { Button } from "@skilltego/ui";
import { createClient } from "@/lib/supabase/browser";

export function VerifyEmailPanel({ email }: { email: string | null }) {
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    if (!email) return;
    setStatus("sending");
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/onboarding")}`;
    const { error } = await resendVerificationEmail(supabase, email, emailRedirectTo);
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="grid gap-4 text-center">
      <h1 className="text-xl font-semibold">Verify your email</h1>
      <p className="text-sm text-muted-foreground">
        We&apos;ve sent a verification link to{" "}
        <span className="font-medium text-foreground">{email ?? "your email address"}</span>. Click it to
        activate your Skilltego account.
      </p>

      {email && (
        <Button type="button" variant="outline" onClick={handleResend} disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : status === "sent" ? "Email sent" : "Resend email"}
        </Button>
      )}
      {status === "error" && <p className="text-xs text-destructive">Couldn&apos;t resend right now — try again shortly.</p>}

      <Link href="/login" className="text-sm font-medium text-primary hover:underline">
        Back to login
      </Link>
    </div>
  );
}
