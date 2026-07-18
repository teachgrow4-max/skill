"use server";

import { z } from "zod";
import {
  addAvailabilitySlot,
  addMentorReview,
  bookSession,
  deleteAvailabilitySlot,
  getMentorAvailability,
  getMentorAverageRating,
  getMentorReviews,
  getSessionsForMentor,
  getSessionsForStudent,
  markSlotBooked,
  toAvailabilitySlot,
  updateSessionStatus,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { hydrateReviews, hydrateSessions } from "./service";
import type { MentorAvailabilitySlot, MentorReview, MentorSession, SessionStatus } from "@skilltego/types";

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

const slotSchema = z.object({
  startTime: z.string().datetime().or(z.string().min(1)),
  endTime: z.string().datetime().or(z.string().min(1)),
});

export async function addAvailabilitySlotAction(input: { startTime: string; endTime: string }): Promise<ActionResult> {
  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid time range." };
  if (new Date(parsed.data.endTime) <= new Date(parsed.data.startTime)) {
    return { success: false, error: "End time must be after start time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    await addAvailabilitySlot(supabase, {
      mentor_id: user.id,
      start_time: new Date(parsed.data.startTime).toISOString(),
      end_time: new Date(parsed.data.endTime).toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not add slot." };
  }
}

export async function deleteAvailabilitySlotAction(slotId: string): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await deleteAvailabilitySlot(supabase, slotId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not remove slot." };
  }
}

export async function getMentorAvailabilityAction(mentorId: string): Promise<MentorAvailabilitySlot[]> {
  const supabase = await createClient();
  const rows = await getMentorAvailability(supabase, mentorId);
  return rows.filter((row) => !row.is_booked).map(toAvailabilitySlot);
}

export async function bookSessionAction(mentorId: string, slotId: string, scheduledAt: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };
  if (user.id === mentorId) return { success: false, error: "You can't book a session with yourself." };

  try {
    await bookSession(supabase, {
      mentor_id: mentorId,
      student_id: user.id,
      availability_id: slotId,
      scheduled_at: scheduledAt,
      status: "requested",
    });
    await markSlotBooked(supabase, slotId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not book session." };
  }
}

export async function getMySessionsAction(role: "mentor" | "student"): Promise<MentorSession[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rows = role === "mentor" ? await getSessionsForMentor(supabase, user.id) : await getSessionsForStudent(supabase, user.id);
  return hydrateSessions(supabase, rows);
}

export async function updateSessionStatusAction(sessionId: string, status: SessionStatus): Promise<ActionResult> {
  const supabase = await createClient();
  try {
    await updateSessionStatus(supabase, sessionId, status);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update session." };
  }
}

export async function submitMentorReviewAction(sessionId: string, mentorId: string, rating: number, comment: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    await addMentorReview(supabase, {
      session_id: sessionId,
      mentor_id: mentorId,
      student_id: user.id,
      rating,
      comment: comment || null,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not submit review." };
  }
}

export async function getMentorReviewsAction(mentorId: string): Promise<{ reviews: MentorReview[]; average: number; count: number }> {
  const supabase = await createClient();
  const [rows, stats] = await Promise.all([getMentorReviews(supabase, mentorId), getMentorAverageRating(supabase, mentorId)]);
  const reviews = await hydrateReviews(supabase, rows);
  return { reviews, average: stats.average, count: stats.count };
}
