import type { AuthorSummary, MentorAvailabilityRow, MentorAvailabilitySlot, MentorReview, MentorReviewRow, MentorSession, MentorSessionRow } from "@skilltego/types";

export function toAvailabilitySlot(row: MentorAvailabilityRow): MentorAvailabilitySlot {
  return {
    id: row.id,
    mentorId: row.mentor_id,
    startTime: row.start_time,
    endTime: row.end_time,
    isBooked: row.is_booked,
  };
}

export function toMentorSession(row: MentorSessionRow, mentor: AuthorSummary, student: AuthorSummary): MentorSession {
  return {
    id: row.id,
    mentor,
    student,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function toMentorReview(row: MentorReviewRow, student: AuthorSummary): MentorReview {
  return {
    id: row.id,
    sessionId: row.session_id,
    student,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}
