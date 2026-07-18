import { z } from "zod";

export const opportunityKindSchema = z.enum(["job", "internship", "competition", "event", "scholarship"]);

export const opportunitySchema = z.object({
  kind: opportunityKindSchema,
  title: z.string().trim().min(3, "Title is too short").max(200),
  description: z.string().trim().min(20, "Add a bit more detail").max(5000),
  skillCategory: z.string().trim().optional().or(z.literal("")),
  requiredSkills: z.array(z.string().trim().min(1)).max(15).default([]),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  isRemote: z.boolean().default(false),
  compensation: z.string().trim().max(120).optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  eventDate: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "closed"]).default("published"),
});

export type OpportunityInput = z.infer<typeof opportunitySchema>;

export const applicationSchema = z.object({
  coverNote: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const KIND_LABELS: Record<OpportunityInput["kind"], string> = {
  job: "Job",
  internship: "Internship",
  competition: "Competition",
  event: "Campus Event",
  scholarship: "Scholarship",
};

export const COMPANY_KINDS: OpportunityInput["kind"][] = ["job", "internship"];
export const COLLEGE_KINDS: OpportunityInput["kind"][] = ["competition", "event", "scholarship"];
