import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, VerificationRequestRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function createVerificationRequest(
  client: Client,
  input: Database["public"]["Tables"]["verification_requests"]["Insert"],
): Promise<VerificationRequestRow> {
  const { data, error } = await client.from("verification_requests").insert(input).select("*").single();
  if (error) throw error;
  return data;
}

export async function getVerificationRequestsForProfile(
  client: Client,
  profileId: string,
): Promise<VerificationRequestRow[]> {
  const { data, error } = await client
    .from("verification_requests")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPendingVerificationRequests(client: Client): Promise<VerificationRequestRow[]> {
  const { data, error } = await client
    .from("verification_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function reviewVerificationRequest(
  client: Client,
  requestId: string,
  status: "approved" | "rejected",
  reviewedBy: string,
): Promise<VerificationRequestRow> {
  const { data, error } = await client
    .from("verification_requests")
    .update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
    .eq("id", requestId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
