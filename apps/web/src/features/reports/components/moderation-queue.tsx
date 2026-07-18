"use client";

import * as React from "react";
import { Badge, Button } from "@skilltego/ui";
import { formatRelativeTime } from "@skilltego/utils";
import { REPORT_REASON_LABELS } from "../schema";
import { reviewReportAction, type ReportWithReporter } from "../actions";

export function ModerationQueue({ initialReports }: { initialReports: ReportWithReporter[] }) {
  const [reports, setReports] = React.useState(initialReports);

  async function handleReview(reportId: string, status: "actioned" | "dismissed") {
    setReports((prev) => prev.filter((r) => r.id !== reportId));
    await reviewReportAction(reportId, status);
  }

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending reports. Nice and quiet.</p>;
  }

  return (
    <div className="grid gap-3">
      {reports.map((report) => (
        <div key={report.id} className="glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="capitalize">
              {report.target_type}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(report.created_at)}</span>
          </div>
          <p className="mt-2 text-sm font-medium">{REPORT_REASON_LABELS[report.reason]}</p>
          {report.details && <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            Reported by {report.reporter?.full_name ?? "unknown"} · target ID {report.target_id}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => handleReview(report.id, "actioned")}>
              Take action
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleReview(report.id, "dismissed")}>
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
