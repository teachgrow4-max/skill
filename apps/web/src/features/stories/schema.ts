import { z } from "zod";

export const storyStickerSchema = z.enum(["none", "poll", "question", "quiz", "countdown", "emoji_slider"]);

export const createStorySchema = z.object({
  mediaUrl: z.string().url(),
  mediaType: z.enum(["image", "video"]),
  caption: z.string().trim().max(200).optional().or(z.literal("")),
  stickerType: storyStickerSchema.default("none"),
  stickerData: z.record(z.string(), z.unknown()).default({}),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;

export const storyResponseSchema = z.object({
  storyId: z.string().uuid(),
  response: z.record(z.string(), z.unknown()),
});
