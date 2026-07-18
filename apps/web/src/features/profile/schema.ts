import { z } from "zod";

export const skillInputSchema = z.object({
  skillName: z.string().trim().min(1, "Required").max(60),
  category: z.string().trim().min(1, "Required"),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  isPrimary: z.boolean().default(false),
});

export const profileFormSchema = z.object({
  username: z.string().trim().toLowerCase().min(3, "At least 3 characters").max(30, "At most 30 characters"),
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  accountType: z.enum(["student", "professional", "mentor", "company", "college"]),
  bio: z.string().trim().max(500, "Keep it under 500 characters").optional().or(z.literal("")),
  country: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\/.+/.test(v), "Enter a full URL, e.g. https://example.com")
    .optional()
    .or(z.literal("")),
  resumeUrl: z.string().trim().url().optional().or(z.literal("")),
  skills: z.array(skillInputSchema).max(20, "You can list up to 20 skills"),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const ACCOUNT_TYPE_OPTIONS: { value: ProfileFormValues["accountType"]; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "professional", label: "Professional" },
  { value: "mentor", label: "Mentor" },
  { value: "company", label: "Company" },
  { value: "college", label: "College" },
];

type SkillInput = z.infer<typeof skillInputSchema>;

export const PROFICIENCY_OPTIONS: { value: SkillInput["proficiency"]; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];
