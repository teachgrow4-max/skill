import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OpportunityApplicationRow, OpportunityKind, OpportunityRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

const PAGE_SIZE = 20;

export async function createOpportunity(
  client: Client,
  input: Database["public"]["Tables"]["opportunities"]["Insert"],
): Promise<OpportunityRow> {
  const { data, error } = await client.from("opportunities").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateOpportunity(
  client: Client,
  id: string,
  patch: Database["public"]["Tables"]["opportunities"]["Update"],
): Promise<OpportunityRow> {
  const { data, error } = await client.from("opportunities").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteOpportunity(client: Client, id: string): Promise<void> {
  const { error } = await client.from("opportunities").delete().eq("id", id);
  if (error) throw error;
}

export async function getOpportunityById(client: Client, id: string): Promise<OpportunityRow | null> {
  const { data, error } = await client.from("opportunities").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOpportunitiesByAuthor(client: Client, authorId: string): Promise<OpportunityRow[]> {
  const { data, error } = await client
    .from("opportunities")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function listOpportunities(
  client: Client,
  filters: { kinds?: OpportunityKind[]; skillCategory?: string },
  page: number,
): Promise<{ opportunities: OpportunityRow[]; hasMore: boolean }> {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = client
    .from("opportunities")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.kinds && filters.kinds.length > 0) query = query.in("kind", filters.kinds);
  if (filters.skillCategory) query = query.eq("skill_category", filters.skillCategory);

  const { data, error } = await query;
  if (error) throw error;

  return { opportunities: data, hasMore: data.length === PAGE_SIZE };
}

export async function getApplicationCounts(
  client: Client,
  opportunityIds: string[],
): Promise<Map<string, number>> {
  if (opportunityIds.length === 0) return new Map();

  const { data, error } = await client
    .from("opportunity_applications")
    .select("opportunity_id")
    .in("opportunity_id", opportunityIds);
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.opportunity_id, (counts.get(row.opportunity_id) ?? 0) + 1);
  }
  return counts;
}

export async function getAppliedOpportunityIds(
  client: Client,
  opportunityIds: string[],
  applicantId: string,
): Promise<Set<string>> {
  if (opportunityIds.length === 0) return new Set();

  const { data, error } = await client
    .from("opportunity_applications")
    .select("opportunity_id")
    .eq("applicant_id", applicantId)
    .in("opportunity_id", opportunityIds);
  if (error) throw error;

  return new Set(data.map((row) => row.opportunity_id));
}

export async function applyToOpportunity(
  client: Client,
  input: Database["public"]["Tables"]["opportunity_applications"]["Insert"],
): Promise<OpportunityApplicationRow> {
  const { data, error } = await client.from("opportunity_applications").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function getApplicationsForOpportunity(
  client: Client,
  opportunityId: string,
): Promise<OpportunityApplicationRow[]> {
  const { data, error } = await client
    .from("opportunity_applications")
    .select("*")
    .eq("opportunity_id", opportunityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateApplicationStatus(
  client: Client,
  applicationId: string,
  status: OpportunityApplicationRow["status"],
): Promise<void> {
  const { error } = await client.from("opportunity_applications").update({ status }).eq("id", applicationId);
  if (error) throw error;
}
