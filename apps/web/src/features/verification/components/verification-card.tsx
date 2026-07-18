"use client";

import * as React from "react";
import { BadgeCheck } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@skilltego/ui";
import type { VerificationRequestRow } from "@skilltego/types";
import { submitVerificationRequestAction } from "../actions";

export function VerificationCard({
  isVerified,
  latestRequest,
}: {
  isVerified: boolean;
  latestRequest: VerificationRequestRow | null;
}) {
  const [organizationName, setOrganizationName] = React.useState("");
  const [proofUrl, setProofUrl] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  if (isVerified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="size-5 text-primary" />
            Verified
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (latestRequest?.status === "pending" || submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verification requested</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Pending review</Badge>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitVerificationRequestAction({ organizationName, proofUrl });
    setSubmitting(false);
    if (result.success) setSubmitted(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Get verified</CardTitle>
      </CardHeader>
      <CardContent>
        {latestRequest?.status === "rejected" && (
          <p className="mb-2 text-xs text-destructive">
            Your last request wasn&apos;t approved. You can submit a new one.
          </p>
        )}
        <form onSubmit={handleSubmit} className="grid gap-2">
          <Input
            placeholder="Organization name"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
          />
          <Input
            placeholder="Proof URL (company website, LinkedIn, etc.)"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
          />
          <Button type="submit" size="sm" className="w-fit" disabled={submitting || !organizationName}>
            Submit for review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
