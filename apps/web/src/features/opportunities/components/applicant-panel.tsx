"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Button } from "@skilltego/ui";
import { initials, formatRelativeTime } from "@skilltego/utils";
import type { ApplicationStatus, OpportunityApplication } from "@skilltego/types";
import { getApplicantsAction, updateApplicationStatusAction } from "../actions";

const STATUS_OPTIONS: ApplicationStatus[] = ["submitted", "shortlisted", "accepted", "rejected"];

export function ApplicantPanel({ opportunityId }: { opportunityId: string }) {
  const [applicants, setApplicants] = React.useState<OpportunityApplication[] | null>(null);

  React.useEffect(() => {
    getApplicantsAction(opportunityId).then(setApplicants);
  }, [opportunityId]);

  async function handleStatusChange(applicationId: string, status: ApplicationStatus) {
    setApplicants((prev) => prev?.map((a) => (a.id === applicationId ? { ...a, status } : a)) ?? null);
    await updateApplicationStatusAction(applicationId, status);
  }

  if (applicants === null) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (applicants.length === 0) {
    return <p className="text-sm text-muted-foreground">No applicants yet.</p>;
  }

  return (
    <div className="grid gap-2">
      {applicants.map((application) => (
        <div key={application.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
          <Link href={`/profile/${application.applicant.username}`}>
            <Avatar className="size-9">
              <AvatarImage
                src={application.applicant.avatarUrl ?? undefined}
                alt={application.applicant.fullName}
              />
              <AvatarFallback>{initials(application.applicant.fullName)}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${application.applicant.username}`}
              className="text-sm font-medium hover:underline"
            >
              {application.applicant.fullName}
            </Link>
            <p className="truncate text-xs text-muted-foreground">
              {application.coverNote || "No cover note"} · {formatRelativeTime(application.createdAt)}
            </p>
          </div>
          {application.resumeUrl && (
            <Button asChild size="icon" variant="ghost" aria-label="Download resume">
              <a href={application.resumeUrl} target="_blank" rel="noreferrer noopener">
                <FileText className="size-4" />
              </a>
            </Button>
          )}
          <select
            value={application.status}
            onChange={(e) => handleStatusChange(application.id, e.target.value as ApplicationStatus)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
