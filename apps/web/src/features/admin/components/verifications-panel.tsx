"use client";

import * as React from "react";
import { Button } from "@skilltego/ui";
import { formatRelativeTime } from "@skilltego/utils";
import type { VerificationRequestRow } from "@skilltego/types";
import { reviewVerificationRequestAction } from "../actions";

export function VerificationsPanel({ initialRequests }: { initialRequests: VerificationRequestRow[] }) {
  const [requests, setRequests] = React.useState(initialRequests);

  async function handleReview(request: VerificationRequestRow, status: "approved" | "rejected") {
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    await reviewVerificationRequestAction(request.id, request.profile_id, status);
  }

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending verification requests.</p>;
  }

  return (
    <div className="grid gap-3">
      {requests.map((request) => (
        <div key={request.id} className="glass rounded-xl p-4">
          <p className="text-sm font-medium">{request.organization_name}</p>
          {request.proof_url && (
            <a
              href={request.proof_url}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs text-primary hover:underline"
            >
              {request.proof_url}
            </a>
          )}
          {request.notes && <p className="mt-1 text-sm text-muted-foreground">{request.notes}</p>}
          <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(request.created_at)}</p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => handleReview(request, "approved")}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleReview(request, "rejected")}>
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
