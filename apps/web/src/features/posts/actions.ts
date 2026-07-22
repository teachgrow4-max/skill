"use server";

import { revalidatePath } from "next/cache";
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  getArchivedPosts,
  getCommentById,
  getComments,
  getDraftPosts,
  getFollowingIds,
  getFollowingPosts,
  getLatestPosts,
  getPinnedPostCount,
  getPostById,
  getPostsByAuthor,
  getPostsByIds,
  getProfileById,
  getReelsPosts,
  getSavedPosts,
  getTrendingPosts,
  likePost,
  savePost,
  setPostArchived,
  setPostPinned,
  unlikePost,
  unsavePost,
  updatePost,
} from "@skilltego/database";
import { moderateText } from "@skilltego/moderation";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/web-push";
import { commentSchema, createPostSchema, type CreatePostInput } from "./schema";
import { hydrateComments, hydratePosts } from "./service";
import type { Comment, Post } from "@skilltego/types";

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export type FeedMode = "latest" | "following" | "trending";

export async function getFeedAction(
  mode: FeedMode,
  cursor: string | null,
): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let page: { posts: Awaited<ReturnType<typeof getLatestPosts>>["posts"]; nextCursor: string | null };

  if (mode === "following" && user) {
    const followingIds = await getFollowingIds(supabase, user.id);
    page = await getFollowingPosts(supabase, followingIds, cursor);
  } else if (mode === "trending") {
    page = await getTrendingPosts(supabase, cursor ? Number(cursor) : 0);
  } else {
    page = await getLatestPosts(supabase, cursor);
  }

  const posts = await hydratePosts(supabase, page.posts, user?.id ?? null);
  return { posts, nextCursor: page.nextCursor };
}

export async function getReelsAction(
  cursor: string | null,
): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = await getReelsPosts(supabase, cursor);
  const posts = await hydratePosts(supabase, page.posts, user?.id ?? null);
  return { posts, nextCursor: page.nextCursor };
}

export async function getProfilePostsAction(
  authorId: string,
  cursor: string | null,
): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = await getPostsByAuthor(supabase, authorId, cursor);
  const posts = await hydratePosts(supabase, page.posts, user?.id ?? null);
  return { posts, nextCursor: page.nextCursor };
}

export async function createPostAction(input: CreatePostInput): Promise<ActionResult<{ id: string }>> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid post." };
  }
  const values = parsed.data;

  if (values.caption) {
    const moderation = moderateText(values.caption);
    if (!moderation.allowed) {
      return { success: false, error: moderation.reasons[0] };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    const post = await createPost(supabase, {
      author_id: user.id,
      type: values.type,
      caption: values.caption || null,
      code_language: values.codeLanguage || null,
      code_snippet: values.codeSnippet || null,
      skill_category: values.skillCategory || null,
      tags: values.tags,
      location: values.location || null,
      media: values.media,
      github_url: values.githubUrl || null,
      project_url: values.projectUrl || null,
      status: values.status,
      scheduled_at: values.scheduledAt || null,
      hide_like_count: values.hideLikeCount,
    });

    revalidatePath("/feed");
    return { success: true, data: { id: post.id } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not create post." };
  }
}

export async function deletePostAction(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const post = await getPostById(supabase, postId);
  if (!post || post.author_id !== user.id) {
    return { success: false, error: "You can only delete your own posts." };
  }

  try {
    await deletePost(supabase, postId);
    revalidatePath("/feed");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete post." };
  }
}

export async function toggleLikeAction(
  postId: string,
  isCurrentlyLiked: boolean,
): Promise<ActionResult<{ isLiked: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    if (isCurrentlyLiked) {
      await unlikePost(supabase, postId, user.id);
    } else {
      await likePost(supabase, postId, user.id);

      const [post, liker] = await Promise.all([
        getPostById(supabase, postId),
        getProfileById(supabase, user.id),
      ]);
      if (post && liker && post.author_id !== user.id) {
        await sendPushToUser(supabase, post.author_id, {
          title: liker.full_name,
          body: "Liked your post",
          url: `/feed?post=${postId}`,
        });
      }
    }
    return { success: true, data: { isLiked: !isCurrentlyLiked } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function toggleSaveAction(
  postId: string,
  isCurrentlySaved: boolean,
): Promise<ActionResult<{ isSaved: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    if (isCurrentlySaved) {
      await unsavePost(supabase, postId, user.id);
    } else {
      await savePost(supabase, postId, user.id);
    }
    return { success: true, data: { isSaved: !isCurrentlySaved } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
  }
}

export async function getPostCommentsAction(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const rows = await getComments(supabase, postId);
  return hydrateComments(supabase, rows);
}

export async function addCommentAction(
  postId: string,
  input: { body: string; parentCommentId?: string | null },
): Promise<ActionResult<{ comment: Comment }>> {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  const moderation = moderateText(parsed.data.body);
  if (!moderation.allowed) {
    return { success: false, error: moderation.reasons[0] };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  try {
    const row = await addComment(supabase, {
      post_id: postId,
      author_id: user.id,
      body: parsed.data.body,
      parent_comment_id: parsed.data.parentCommentId ?? null,
    });

    const [comment] = await hydrateComments(supabase, [row]);
    revalidatePath(`/feed`);

    const [post, commenter, parentComment] = await Promise.all([
      getPostById(supabase, postId),
      getProfileById(supabase, user.id),
      parsed.data.parentCommentId ? getCommentById(supabase, parsed.data.parentCommentId) : null,
    ]);

    if (post && commenter) {
      if (post.author_id !== user.id) {
        await sendPushToUser(supabase, post.author_id, {
          title: commenter.full_name,
          body: `Commented: ${parsed.data.body.slice(0, 80)}`,
          url: `/feed?post=${postId}`,
        });
      }
      if (
        parentComment &&
        parentComment.author_id !== user.id &&
        parentComment.author_id !== post.author_id
      ) {
        await sendPushToUser(supabase, parentComment.author_id, {
          title: commenter.full_name,
          body: `Replied: ${parsed.data.body.slice(0, 80)}`,
          url: `/feed?post=${postId}`,
        });
      }
    }

    return { success: true, data: { comment } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not post comment." };
  }
}

export async function deleteCommentAction(commentId: string, authorId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== authorId) {
    return { success: false, error: "You can only delete your own comments." };
  }

  try {
    await deleteComment(supabase, commentId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not delete comment." };
  }
}

const MAX_PINNED_POSTS = 3;

export async function toggleArchivePostAction(
  postId: string,
): Promise<ActionResult<{ isArchived: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const post = await getPostById(supabase, postId);
  if (!post || post.author_id !== user.id) {
    return { success: false, error: "You can only archive your own posts." };
  }

  try {
    await setPostArchived(supabase, postId, !post.is_archived);
    revalidatePath("/feed");
    revalidatePath("/bookmarks");
    return { success: true, data: { isArchived: !post.is_archived } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update post." };
  }
}

export async function togglePinPostAction(postId: string): Promise<ActionResult<{ isPinned: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const post = await getPostById(supabase, postId);
  if (!post || post.author_id !== user.id) {
    return { success: false, error: "You can only pin your own posts." };
  }

  if (!post.is_pinned) {
    const pinnedCount = await getPinnedPostCount(supabase, user.id);
    if (pinnedCount >= MAX_PINNED_POSTS) {
      return { success: false, error: `You can only pin up to ${MAX_PINNED_POSTS} posts.` };
    }
  }

  try {
    await setPostPinned(supabase, postId, !post.is_pinned);
    revalidatePath(`/profile/${user.id}`);
    return { success: true, data: { isPinned: !post.is_pinned } };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not update post." };
  }
}

export async function getMyArchivedPostsAction(): Promise<Post[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rows = await getArchivedPosts(supabase, user.id);
  return hydratePosts(supabase, rows, user.id);
}

export async function getMyDraftsAction(): Promise<Post[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const rows = await getDraftPosts(supabase, user.id);
  return hydratePosts(supabase, rows, user.id);
}

export async function publishDraftAction(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "You must be logged in." };

  const post = await getPostById(supabase, postId);
  if (!post || post.author_id !== user.id) {
    return { success: false, error: "You can only publish your own drafts." };
  }

  try {
    await updatePost(supabase, postId, { status: "published" });
    revalidatePath("/feed");
    revalidatePath("/profile/drafts");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Could not publish draft." };
  }
}

export async function getBookmarkedPostsAction(): Promise<Post[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const postIds = await getSavedPosts(supabase, user.id);
  const rows = await getPostsByIds(supabase, postIds);
  return hydratePosts(supabase, rows, user.id);
}
