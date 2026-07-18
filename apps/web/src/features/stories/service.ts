import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getProfilesByIds,
  getStoryViewCounts,
  getViewedStoryIds,
  toAuthorSummary,
  toStory,
} from "@skilltego/database";
import type { Database, Story, StoryGroup, StoryRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

export async function hydrateStoryGroups(
  client: Client,
  rows: StoryRow[],
  viewerId: string | null,
): Promise<StoryGroup[]> {
  if (rows.length === 0) return [];

  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const storyIds = rows.map((row) => row.id);

  const [authors, viewCounts, viewedIds] = await Promise.all([
    getProfilesByIds(client, authorIds),
    getStoryViewCounts(client, storyIds),
    viewerId ? getViewedStoryIds(client, storyIds, viewerId) : Promise.resolve(new Set<string>()),
  ]);

  const authorMap = new Map(authors.map((author) => [author.id, toAuthorSummary(author)]));

  const stories: Story[] = rows
    .filter((row) => authorMap.has(row.author_id))
    .map((row) =>
      toStory(row, authorMap.get(row.author_id)!, viewCounts.get(row.id) ?? 0, viewedIds.has(row.id)),
    );

  const groupMap = new Map<string, Story[]>();
  for (const story of stories) {
    const list = groupMap.get(story.author.id) ?? [];
    list.push(story);
    groupMap.set(story.author.id, list);
  }

  const groups: StoryGroup[] = [...groupMap.entries()].map(([authorId, authorStories]) => ({
    author: authorMap.get(authorId)!,
    stories: authorStories,
    allViewed: authorStories.every((s) => s.viewedByMe),
  }));

  // Own stories first, then unviewed-first ordering for everyone else.
  return groups.sort((a, b) => {
    if (viewerId) {
      if (a.author.id === viewerId) return -1;
      if (b.author.id === viewerId) return 1;
    }
    return Number(a.allViewed) - Number(b.allViewed);
  });
}
