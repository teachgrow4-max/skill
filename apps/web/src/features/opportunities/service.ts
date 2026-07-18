import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getAppliedOpportunityIds,
  getApplicationCounts,
  getProfilesByIds,
  toAuthorSummary,
  toOpportunity,
  toOpportunityApplication,
} from "@skilltego/database";
import type {
  Database,
  Opportunity,
  OpportunityApplication,
  OpportunityApplicationRow,
  OpportunityRow,
} from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function hydrateOpportunities(
  client: Client,
  rows: OpportunityRow[],
  viewerId: string | null,
): Promise<Opportunity[]> {
  if (rows.length === 0) return [];

  const authorIds = rows.map((row) => row.author_id);
  const opportunityIds = rows.map((row) => row.id);

  const [authors, counts, appliedIds] = await Promise.all([
    getProfilesByIds(client, authorIds),
    getApplicationCounts(client, opportunityIds),
    viewerId
      ? getAppliedOpportunityIds(client, opportunityIds, viewerId)
      : Promise.resolve(new Set<string>()),
  ]);

  const authorMap = new Map(authors.map((author) => [author.id, toAuthorSummary(author)]));

  return rows
    .filter((row) => authorMap.has(row.author_id))
    .map((row) =>
      toOpportunity(row, authorMap.get(row.author_id)!, {
        applicationCount: counts.get(row.id) ?? 0,
        hasApplied: appliedIds.has(row.id),
      }),
    );
}

export async function hydrateApplications(
  client: Client,
  rows: OpportunityApplicationRow[],
): Promise<OpportunityApplication[]> {
  if (rows.length === 0) return [];

  const applicantIds = rows.map((row) => row.applicant_id);
  const applicants = await getProfilesByIds(client, applicantIds);
  const applicantMap = new Map(applicants.map((applicant) => [applicant.id, applicant]));

  return rows
    .filter((row) => applicantMap.has(row.applicant_id))
    .map((row) => {
      const applicant = applicantMap.get(row.applicant_id)!;
      return toOpportunityApplication(row, toAuthorSummary(applicant), applicant.resume_url);
    });
}
