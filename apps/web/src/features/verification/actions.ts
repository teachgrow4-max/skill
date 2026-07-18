"use server";

import { z } from "zod";
import { createVerificationRequest, getVerificationRequestsForProfile } from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import type { VerificationRequestRow } from "@skilltego/types";

const requestSchema = z.object({
  organizationName: z.string().trim().min(2).max(200),
  proofUrl: z.string().trim().url().optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function submitVerificationRequestAction(input: {
  organizationName: string;
  proofUrl?: string;
  notes?: string;
}): Promise<ActionResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    await createVerificationRequest(supabase, {
      profile_id: user.id,
      organization_name: parsed.data.organizationName,
      proof_url: parsed.data.proofUrl || null,
      notes: parsed.data.notes || null,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not submit request." };
  }
}

export async function getMyVerificationRequestsAction(): Promise<VerificationRequestRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getVerificationRequestsForProfile(supabase, user.id);
}
