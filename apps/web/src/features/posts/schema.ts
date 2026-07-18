import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Enter a full URL, e.g. https://example.com");

export const postMediaItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(["image", "video", "pdf"]),
  width: z.number().optional(),
  height: z.number().optional(),
  publicId: z.string().optional(),
});

export const postTypeSchema = z.enum([
  "text",
  "image",
  "carousel",
  "video",
  "pdf",
  "code",
  "github_link",
  "project_link",
]);

export const createPostSchema = z
  .object({
    type: postTypeSchema,
    caption: z.string().trim().max(3000, "Keep it under 3000 characters").optional().or(z.literal("")),
    codeLanguage: z.string().trim().max(40).optional().or(z.literal("")),
    codeSnippet: z
      .string()
      .trim()
      .max(20000, "Keep code snippets under 20,000 characters")
      .optional()
      .or(z.literal("")),
    skillCategory: z.string().trim().optional().or(z.literal("")),
    tags: z.array(z.string().trim().min(1).max(30)).max(10, "Up to 10 tags").default([]),
    location: z.string().trim().max(120).optional().or(z.literal("")),
    media: z.array(postMediaItemSchema).max(10, "Up to 10 media items").default([]),
    githubUrl: urlOrEmpty.optional().or(z.literal("")),
    projectUrl: urlOrEmpty.optional().or(z.literal("")),
    status: z.enum(["draft", "scheduled", "published"]).default("published"),
    scheduledAt: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const requiresCaption = data.type === "text" && !data.caption;
    const requiresMedia =
      ["image", "carousel", "video", "pdf"].includes(data.type) && data.media.length === 0;
    const requiresCode = data.type === "code" && !data.codeSnippet;
    const requiresGithub = data.type === "github_link" && !data.githubUrl;
    const requiresProject = data.type === "project_link" && !data.projectUrl;

    if (requiresCaption) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Write something for this post",
        path: ["caption"],
      });
    }
    if (requiresMedia) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Upload at least one file", path: ["media"] });
    }
    if (requiresCode) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Add a code snippet", path: ["codeSnippet"] });
    }
    if (requiresGithub) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Add a GitHub URL", path: ["githubUrl"] });
    }
    if (requiresProject) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Add a project URL", path: ["projectUrl"] });
    }
    if (data.status === "scheduled" && !data.scheduledAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Pick a date and time", path: ["scheduledAt"] });
    }
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment").max(1000, "Keep it under 1000 characters"),
  parentCommentId: z.string().uuid().nullable().optional(),
});

export type CommentInput = z.infer<typeof commentSchema>;
