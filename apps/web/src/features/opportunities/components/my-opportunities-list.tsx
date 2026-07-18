"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@skilltego/ui";
import { formatRelativeTime } from "@skilltego/utils";
import type { Opportunity } from "@skilltego/types";
import { KIND_LABELS } from "../schema";
import { closeOpportunityAction, deleteOpportunityAction } from "../actions";
import { ApplicantPanel } from "./applicant-panel";

export function MyOpportunitiesList({ initialOpportunities }: { initialOpportunities: Opportunity[] }) {
  const router = useRouter();
  const [opportunities, setOpportunities] = React.useState(initialOpportunities);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  async function handleToggleClosed(id: string) {
    await closeOpportunityAction(id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this posting? This can't be undone.")) return;
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    await deleteOpportunityAction(id);
  }

  if (opportunities.length === 0) {
    return <p className="text-sm text-muted-foreground">You haven&apos;t posted anything yet.</p>;
  }

  return (
    <div className="grid gap-3">
      {opportunities.map((opportunity) => (
        <Card key={opportunity.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{KIND_LABELS[opportunity.kind]}</Badge>
              <Badge variant={opportunity.status === "closed" ? "outline" : "success"}>{opportunity.status}</Badge>
            </div>
            <CardTitle className="text-base">{opportunity.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {opportunity.applicationCount} applicant{opportunity.applicationCount === 1 ? "" : "s"} · Posted{" "}
              {formatRelativeTime(opportunity.createdAt)}
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setExpandedId(expandedId === opportunity.id ? null : opportunity.id)}>
              {expandedId === opportunity.id ? "Hide applicants" : "View applicants"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleToggleClosed(opportunity.id)}>
              {opportunity.status === "closed" ? "Reopen" : "Close"}
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleDelete(opportunity.id)}>
              Delete
            </Button>
          </CardContent>
          {expandedId === opportunity.id && (
            <CardContent>
              <ApplicantPanel opportunityId={opportunity.id} />
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
