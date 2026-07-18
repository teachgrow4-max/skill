import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getLikedPostIds,
  getProfilesByIds,
  getSavedPostIds,
  toAuthorSummary,
  toComment,
  toPost,
} from "@skilltego/database";
import type { Comment, Database, Post, PostCommentRow, PostRow } from "@skilltego/types";

type Client = SupabaseClient<Database>;

/** Batch-fetches authors and like/save flags for a page of posts — avoids N+1 queries. */
export async function hydratePosts(client: Client, postRows: PostRow[], viewerId: string | null): Promise<Post[]> {
  if (postRows.length === 0) return [];

  const authorIds = postRows.map((row) => row.author_id);
  const postIds = postRows.map((row) => row.id);

  const [authors, likedIds, savedIds] = await Promise.all([
    getProfilesByIds(client, authorIds),
    viewerId ? getLikedPostIds(client, postIds, viewerId) : Promise.resolve(new Set<string>()),
    viewerId ? getSavedPostIds(client, postIds, viewerId) : Promise.resolve(new Set<string>()),
  ]);

  const authorMap = new Map(authors.map((author) => [author.id, toAuthorSummary(author)]));

  return postRows
    .filter((row) => authorMap.has(row.author_id))
    .map((row) =>
      toPost(row, authorMap.get(row.author_id)!, {
        isLiked: likedIds.has(row.id),
        isSaved: savedIds.has(row.id),
      }),
    );
}

export async function hydrateComments(client: Client, rows: PostCommentRow[]): Promise<Comment[]> {
  if (rows.length === 0) return [];

  const authorIds = rows.map((row) => row.author_id);
  const authors = await getProfilesByIds(client, authorIds);
  const authorMap = new Map(authors.map((author) => [author.id, toAuthorSummary(author)]));

  return rows.filter((row) => authorMap.has(row.author_id)).map((row) => toComment(row, authorMap.get(row.author_id)!));
}
