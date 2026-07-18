"use server";

import {
  createReport,
  getPendingReports,
  getProfilesByIds,
  isModerator,
  updateReportStatus,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { reportSchema, type ReportInput } from "./schema";
import type { ProfileRow, ReportRow, ReportStatus } from "@skilltego/types";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function submitReportAction(input: ReportInput): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid report." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in to report content." };

  try {
    await createReport(supabase, {
      reporter_id: user.id,
      target_type: parsed.data.targetType,
      target_id: parsed.data.targetId,
      reason: parsed.data.reason,
      details: parsed.data.details || null,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not submit report." };
  }
}

export interface ReportWithReporter extends ReportRow {
  reporter: ProfileRow | null;
}

export async function getModerationQueueAction(): Promise<{
  isModerator: boolean;
  reports: ReportWithReporter[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isModerator: false, reports: [] };

  const moderator = await isModerator(supabase, user.id);
  if (!moderator) return { isModerator: false, reports: [] };

  const reports = await getPendingReports(supabase);
  const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
  const reporters = await getProfilesByIds(supabase, reporterIds);
  const reporterMap = new Map(reporters.map((r) => [r.id, r]));

  return {
    isModerator: true,
    reports: reports.map((report) => ({ ...report, reporter: reporterMap.get(report.reporter_id) ?? null })),
  };
}

export async function reviewReportAction(reportId: string, status: ReportStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const moderator = await isModerator(supabase, user.id);
  if (!moderator) return { success: false, error: "You don't have permission to do that." };

  try {
    await updateReportStatus(supabase, reportId, status, user.id);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update report." };
  }
}
