"use server";

import {
  bookmarkCandidate,
  getBookmarkedCandidates,
  isCandidateBookmarked,
  searchProfilesBySkill,
  unbookmarkCandidate,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow } from "@skilltego/types";

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function searchTalentAction(skillQuery: string): Promise<ProfileRow[]> {
  const trimmed = skillQuery.trim();
  if (trimmed.length < 2) return [];

  const supabase = await createClient();
  return searchProfilesBySkill(supabase, `%${trimmed}%`);
}

export async function toggleCandidateBookmarkAction(
  candidateId: string,
  isCurrentlyBookmarked: boolean,
): Promise<ActionResult<{ isBookmarked: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    if (isCurrentlyBookmarked) {
      await unbookmarkCandidate(supabase, user.id, candidateId);
    } else {
      await bookmarkCandidate(supabase, user.id, candidateId);
    }
    return { success: true, data: { isBookmarked: !isCurrentlyBookmarked } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function getMyBookmarkedCandidatesAction(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getBookmarkedCandidates(supabase, user.id);
}

export async function isCandidateBookmarkedAction(candidateId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return isCandidateBookmarked(supabase, user.id, candidateId);
}
