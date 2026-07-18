import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProfilesByIds, toAuthorSummary, toMentorReview, toMentorSession } from "@skilltego/database";
import type {
  Database,
  MentorReview,
  MentorReviewRow,
  MentorSession,
  MentorSessionRow,
} from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function hydrateSessions(client: Client, rows: MentorSessionRow[]): Promise<MentorSession[]> {
  if (rows.length === 0) return [];

  const ids = [...new Set([...rows.map((r) => r.mentor_id), ...rows.map((r) => r.student_id)])];
  const profiles = await getProfilesByIds(client, ids);
  const profileMap = new Map(profiles.map((p) => [p.id, toAuthorSummary(p)]));

  return rows
    .filter((row) => profileMap.has(row.mentor_id) && profileMap.has(row.student_id))
    .map((row) => toMentorSession(row, profileMap.get(row.mentor_id)!, profileMap.get(row.student_id)!));
}

export async function hydrateReviews(client: Client, rows: MentorReviewRow[]): Promise<MentorReview[]> {
  if (rows.length === 0) return [];

  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const profiles = await getProfilesByIds(client, studentIds);
  const profileMap = new Map(profiles.map((p) => [p.id, toAuthorSummary(p)]));

  return rows
    .filter((row) => profileMap.has(row.student_id))
    .map((row) => toMentorReview(row, profileMap.get(row.student_id)!));
}
