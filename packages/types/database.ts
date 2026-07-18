/**
 * Hand-maintained mirror of the Supabase schema defined in
 * packages/database/migrations. Keep in sync when migrations change.
 * (Regenerate with `supabase gen types typescript` once a live project exists.)
 */

export type AccountType =
  | "student"
  | "professional"
  | "mentor"
  | "company"
  | "college"
  | "admin"
  | "moderator";

export type AvailabilityStatus = "available" | "open_to_offers" | "not_available";

export interface Json {
  [key: string]: string | number | boolean | null | Json[] | { [key: string]: Json };
}

export interface ProfileRow {
  id: string;
  username: string;
  full_name: string;
  account_type: AccountType;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  school: string | null;
  college: string | null;
  company: string | null;
  website: string | null;
  socials: Json | null;
  languages: string[] | null;
  availability: AvailabilityStatus;
  is_verified: boolean;
  xp: number;
  coins: number;
  level: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileSkillRow {
  id: string;
  profile_id: string;
  skill_name: string;
  category: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  years_experience: number | null;
  is_primary: boolean;
  created_at: string;
}

export interface ProfileEducationRow {
  id: string;
  profile_id: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
  created_at: string;
}

export interface ProfileExperienceRow {
  id: string;
  profile_id: string;
  organization: string;
  role: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  created_at: string;
}

export interface FollowRow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; username: string; full_name: string };
        Update: Partial<ProfileRow>;
      };
      profile_skills: {
        Row: ProfileSkillRow;
        Insert: Partial<ProfileSkillRow> & { profile_id: string; skill_name: string; category: string };
        Update: Partial<ProfileSkillRow>;
      };
      profile_education: {
        Row: ProfileEducationRow;
        Insert: Partial<ProfileEducationRow> & { profile_id: string; institution: string };
        Update: Partial<ProfileEducationRow>;
      };
      profile_experience: {
        Row: ProfileExperienceRow;
        Insert: Partial<ProfileExperienceRow> & { profile_id: string; organization: string; role: string };
        Update: Partial<ProfileExperienceRow>;
      };
      follows: {
        Row: FollowRow;
        Insert: FollowRow;
        Update: Partial<FollowRow>;
      };
    };
  };
}
