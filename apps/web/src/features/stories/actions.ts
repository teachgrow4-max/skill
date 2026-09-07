"use server";

import { revalidatePath } from "next/cache";
import {
  createStory,
  deleteStories,
  deleteStory,
  getActiveStoriesForAuthors,
  getExpiredStories,
  getFollowingIds,
  getProfilesByIds,
  getStoryById,
  getStoryResponses,
  getStoryViewerIds,
  recordStoryView,
  removeStorageObjectsByUrl,
  submitStoryResponse,
  toAuthorSummary,
} from "@skilltego/database";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hydrateStoryGroups } from "./service";
import { createStorySchema, type CreateStoryInput } from "./schema";
import type { AuthorSummary, StoryGroup, StoryResponseRow } from "@skilltego/types";

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

// Stories carry an expires_at, but nothing ever actually deletes an expired
// row or its media file — "expired" only ever meant "filtered out of query
// results". Every story ever posted was piling up in Storage forever. There's
// no cron/worker in this app, so instead this piggybacks on the one action
// that's called on essentially every feed load, cleaning up a small batch
// each time. Uses the service-role client since it needs to remove other
// users' expired stories, not just the caller's own.
async function sweepExpiredStories(): Promise<void> {
  try {
    const admin = createAdminClient();
    const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const expired = await getExpiredStories(admin, cutoff, 25);
    if (expired.length === 0) return;

    await deleteStories(admin, expired.map((story) => story.id));
    await removeStorageObjectsByUrl(admin, expired.map((story) => story.media_url));
  } catch (error) {
    console.error("Expired story sweep failed:", error);
  }
}

export async function getStoriesFeedAction(): Promise<StoryGroup[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  await sweepExpiredStories();

  const followingIds = await getFollowingIds(supabase, user.id);
  const authorIds = [...new Set([user.id, ...followingIds])];

  const rows = await getActiveStoriesForAuthors(supabase, authorIds);
  return hydrateStoryGroups(supabase, rows, user.id);
}

export async function createStoryAction(input: CreateStoryInput): Promise<ActionResult<{ id: string }>> {
  const parsed = createStorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid story." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    const values = parsed.data;
    const story = await createStory(supabase, {
      author_id: user.id,
      media_url: values.mediaUrl,
      media_type: values.mediaType,
      caption: values.caption || null,
      sticker_type: values.stickerType,
      sticker_data: values.stickerData,
    });

    revalidatePath("/feed");
    return { success: true, data: { id: story.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not create story." };
  }
}

export async function deleteStoryAction(storyId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const story = await getStoryById(supabase, storyId);
  if (!story || story.author_id !== user.id) {
    return { success: false, error: "You can only delete your own stories." };
  }

  try {
    await deleteStory(supabase, storyId);
    revalidatePath("/feed");
    await removeStorageObjectsByUrl(supabase, [story.media_url]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete story." };
  }
}

export async function viewStoryAction(storyId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const story = await getStoryById(supabase, storyId);
  if (!story || story.author_id === user.id) return;

  await recordStoryView(supabase, storyId, user.id);
}

export async function respondToStoryAction(
  storyId: string,
  response: Record<string, string | number | boolean | null>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    await submitStoryResponse(supabase, { story_id: storyId, viewer_id: user.id, response });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not submit response." };
  }
}

export async function getStoryViewersAction(storyId: string): Promise<AuthorSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const story = await getStoryById(supabase, storyId);
  if (!story || story.author_id !== user.id) return [];

  const viewerIds = await getStoryViewerIds(supabase, storyId);
  const profiles = await getProfilesByIds(supabase, viewerIds);
  const profileMap = new Map(profiles.map((p) => [p.id, toAuthorSummary(p)]));
  return viewerIds.map((id) => profileMap.get(id)).filter((p): p is AuthorSummary => Boolean(p));
}

export async function getStoryResponsesAction(storyId: string): Promise<StoryResponseRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const story = await getStoryById(supabase, storyId);
  if (!story || story.author_id !== user.id) return [];

  return getStoryResponses(supabase, storyId);
}
