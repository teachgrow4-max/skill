import { z } from "zod";

export const reportSchema = z.object({
  targetType: z.enum(["post", "comment", "profile", "message"]),
  targetId: z.string().uuid(),
  reason: z.enum(["spam", "harassment", "inappropriate_content", "fake_account", "impersonation", "other"]),
  details: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const REPORT_REASON_LABELS: Record<ReportInput["reason"], string> = {
  spam: "Spam",
  harassment: "Harassment or bullying",
  inappropriate_content: "Inappropriate content",
  fake_account: "Fake account",
  impersonation: "Impersonation",
  other: "Other",
};
