import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MentorAvailabilityRow, MentorReviewRow, MentorSessionRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function addAvailabilitySlot(
  client: Client,
  input: Database["public"]["Tables"]["mentor_availability"]["Insert"],
): Promise<MentorAvailabilityRow> {
  const { data, error } = await client.from("mentor_availability").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteAvailabilitySlot(client: Client, id: string): Promise<void> {
  const { error } = await client.from("mentor_availability").delete().eq("id", id);
  if (error) throw error;
}

export async function getMentorAvailability(
  client: Client,
  mentorId: string,
  upcomingOnly = true,
): Promise<MentorAvailabilityRow[]> {
  let query = client
    .from("mentor_availability")
    .select("*")
    .eq("mentor_id", mentorId)
    .order("start_time", { ascending: true });
  if (upcomingOnly) query = query.gte("start_time", new Date().toISOString());

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function markSlotBooked(client: Client, slotId: string): Promise<void> {
  const { error } = await client.from("mentor_availability").update({ is_booked: true }).eq("id", slotId);
  if (error) throw error;
}

export async function bookSession(
  client: Client,
  input: Database["public"]["Tables"]["mentor_sessions"]["Insert"],
): Promise<MentorSessionRow> {
  const { data, error } = await client.from("mentor_sessions").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function getSessionsForMentor(client: Client, mentorId: string): Promise<MentorSessionRow[]> {
  const { data, error } = await client
    .from("mentor_sessions")
    .select("*")
    .eq("mentor_id", mentorId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getSessionsForStudent(client: Client, studentId: string): Promise<MentorSessionRow[]> {
  const { data, error } = await client
    .from("mentor_sessions")
    .select("*")
    .eq("student_id", studentId)
    .order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function updateSessionStatus(
  client: Client,
  sessionId: string,
  status: MentorSessionRow["status"],
): Promise<void> {
  const { error } = await client.from("mentor_sessions").update({ status }).eq("id", sessionId);
  if (error) throw error;
}

export async function addMentorReview(
  client: Client,
  input: Database["public"]["Tables"]["mentor_reviews"]["Insert"],
): Promise<MentorReviewRow> {
  const { data, error } = await client.from("mentor_reviews").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function getMentorReviews(client: Client, mentorId: string): Promise<MentorReviewRow[]> {
  const { data, error } = await client
    .from("mentor_reviews")
    .select("*")
    .eq("mentor_id", mentorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMentorAverageRating(
  client: Client,
  mentorId: string,
): Promise<{ average: number; count: number }> {
  const reviews = await getMentorReviews(client, mentorId);
  if (reviews.length === 0) return { average: 0, count: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: total / reviews.length, count: reviews.length };
}
