"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { Button, Textarea } from "@skilltego/ui";
import { REPORT_REASON_LABELS, type ReportInput } from "../schema";
import { submitReportAction } from "../actions";

interface ReportButtonProps {
  targetType: ReportInput["targetType"];
  targetId: string;
  isLoggedIn: boolean;
}

export function ReportButton({ targetType, targetId, isLoggedIn }: ReportButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<ReportInput["reason"]>("spam");
  const [details, setDetails] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

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
    const result = await submitReportAction({ targetType, targetId, reason, details });
    setSubmitting(false);
    if (result.success) setDone(true);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
      >
        <Flag className="size-3" />
        Report
      </button>
    );
  }

  if (done) {
    return (
      <p className="text-xs text-muted-foreground">
        Report submitted. Thanks for helping keep Skilltego safe.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2 rounded-lg border border-border p-3 text-sm">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value as ReportInput["reason"])}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <Textarea
        placeholder="Additional details (optional)"
        rows={2}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          Submit report
        </Button>
      </div>
    </form>
  );
}
