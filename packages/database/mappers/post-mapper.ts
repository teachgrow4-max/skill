import type { AuthorSummary, Comment, Post, PostCommentRow, PostRow, ProfileRow } from "@skilltego/types";

export function toAuthorSummary(row: ProfileRow): AuthorSummary {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    accountType: row.account_type,
    isVerified: row.is_verified,
  };
}

export function toPost(
  row: PostRow,
  author: AuthorSummary,
  flags: { isLiked: boolean; isSaved: boolean },
): Post {
  return {
    id: row.id,
    author,
    type: row.type,
    caption: row.caption,
    codeLanguage: row.code_language,
    codeSnippet: row.code_snippet,
    skillCategory: row.skill_category,
    tags: row.tags,
    location: row.location,
    thumbnailUrl: row.thumbnail_url,
    media: row.media,
    githubUrl: row.github_url,
    projectUrl: row.project_url,
    status: row.status,
    scheduledAt: row.scheduled_at,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    saveCount: row.save_count,
    isLiked: flags.isLiked,
    isSaved: flags.isSaved,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toComment(row: PostCommentRow, author: AuthorSummary): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    author,
    parentCommentId: row.parent_comment_id,
    body: row.is_deleted ? "[deleted]" : row.body,
    isDeleted: row.is_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
