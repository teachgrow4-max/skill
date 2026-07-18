import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReportRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function createReport(
  client: Client,
  input: Database["public"]["Tables"]["reports"]["Insert"],
): Promise<ReportRow> {
  const { data, error } = await client.from("reports").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function getPendingReports(client: Client): Promise<ReportRow[]> {
  const { data, error } = await client
    .from("reports")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateReportStatus(
  client: Client,
  reportId: string,
  status: ReportRow["status"],
  reviewedBy: string,
): Promise<void> {
  const { error } = await client
    .from("reports")
    .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) throw error;
}
