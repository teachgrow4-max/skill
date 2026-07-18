import type { AuthorSummary, Story, StoryRow } from "@skilltego/types";

export function toStory(row: StoryRow, author: AuthorSummary, viewCount: number, viewedByMe: boolean): Story {
  return {
    id: row.id,
    author,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    caption: row.caption,
    stickerType: row.sticker_type,
    stickerData: row.sticker_data,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    viewCount,
    viewedByMe,
  };
}
