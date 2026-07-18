import type { AccountType, AvailabilityStatus } from "./database";

export interface SkillTag {
  name: string;
  category: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  behance?: string;
  dribbble?: string;
}

export interface Profile {
  id: string;
  username: string;
  fullName: string;
  accountType: AccountType;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  school: string | null;
  college: string | null;
  company: string | null;
  website: string | null;
  socials: SocialLinks;
  languages: string[];
  availability: AvailabilityStatus;
  isVerified: boolean;
  xp: number;
  coins: number;
  level: number;
  onboardingCompleted: boolean;
  skills: SkillTag[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
}
