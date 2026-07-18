"use server";

import { revalidatePath } from "next/cache";
import {
  applyToOpportunity,
  createOpportunity,
  deleteOpportunity,
  getApplicationsForOpportunity,
  getOpportunitiesByAuthor,
  getOpportunityById,
  listOpportunities,
  updateApplicationStatus,
  updateOpportunity,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { opportunitySchema, type OpportunityInput } from "./schema";
import { hydrateApplications, hydrateOpportunities } from "./service";
import type { ApplicationStatus, Opportunity, OpportunityApplication, OpportunityKind } from "@skilltego/types";

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function listOpportunitiesAction(
  filters: { kinds?: OpportunityKind[]; skillCategory?: string },
  page: number,
): Promise<{ opportunities: Opportunity[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { opportunities: rows, hasMore } = await listOpportunities(supabase, filters, page);
  const opportunities = await hydrateOpportunities(supabase, rows, user?.id ?? null);
  return { opportunities, hasMore };
}

export async function getOpportunityAction(id: string): Promise<Opportunity | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = await getOpportunityById(supabase, id);
  if (!row) return null;

  const [opportunity] = await hydrateOpportunities(supabase, [row], user?.id ?? null);
  return opportunity ?? null;
}

export async function getMyOpportunitiesAction(): Promise<Opportunity[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rows = await getOpportunitiesByAuthor(supabase, user.id);
  return hydrateOpportunities(supabase, rows, user.id);
}

export async function createOpportunityAction(input: OpportunityInput): Promise<ActionResult<{ id: string }>> {
  const parsed = opportunitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid opportunity." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    const values = parsed.data;
    const opportunity = await createOpportunity(supabase, {
      author_id: user.id,
      kind: values.kind,
      title: values.title,
      description: values.description,
      skill_category: values.skillCategory || null,
      required_skills: values.requiredSkills,
      location: values.location || null,
      is_remote: values.isRemote,
      compensation: values.compensation || null,
      deadline: values.deadline || null,
      event_date: values.eventDate || null,
      status: values.status,
    });

    revalidatePath("/opportunities");
    return { success: true, data: { id: opportunity.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not create opportunity." };
  }
}

export async function deleteOpportunityAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const opportunity = await getOpportunityById(supabase, id);
  if (!opportunity || opportunity.author_id !== user.id) {
    return { success: false, error: "You can only delete your own postings." };
  }

  try {
    await deleteOpportunity(supabase, id);
    revalidatePath("/opportunities");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete opportunity." };
  }
}

export async function closeOpportunityAction(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const opportunity = await getOpportunityById(supabase, id);
  if (!opportunity || opportunity.author_id !== user.id) {
    return { success: false, error: "You can only manage your own postings." };
  }

  try {
    await updateOpportunity(supabase, id, { status: opportunity.status === "closed" ? "published" : "closed" });
    revalidatePath("/opportunities");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update opportunity." };
  }
}

export async function applyToOpportunityAction(opportunityId: string, coverNote: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    await applyToOpportunity(supabase, {
      opportunity_id: opportunityId,
      applicant_id: user.id,
      cover_note: coverNote || null,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit application.";
    return { success: false, error: message.includes("duplicate") ? "You've already applied." : message };
  }
}

export async function getApplicantsAction(opportunityId: string): Promise<OpportunityApplication[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const opportunity = await getOpportunityById(supabase, opportunityId);
  if (!opportunity || opportunity.author_id !== user.id) return [];

  const rows = await getApplicationsForOpportunity(supabase, opportunityId);
  return hydrateApplications(supabase, rows);
}

export async function updateApplicationStatusAction(applicationId: string, status: ApplicationStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    await updateApplicationStatus(supabase, applicationId, status);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update application." };
  }
}
