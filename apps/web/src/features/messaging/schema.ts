import { z } from "zod";

export const sendMessageSchema = z.object({
  body: z.string().trim().max(4000).optional(),
  attachment: z
    .object({
      url: z.string().url(),
      type: z.enum(["image", "video", "audio", "pdf"]),
      publicId: z.string().optional(),
    })
    .nullable()
    .optional(),
});
