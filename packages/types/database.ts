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
  search_vector: string | null;
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

export type PostType =
  | "text"
  | "image"
  | "carousel"
  | "video"
  | "pdf"
  | "code"
  | "github_link"
  | "project_link";

export type PostStatus = "draft" | "scheduled" | "published";

export interface PostMediaItem {
  url: string;
  type: "image" | "video" | "pdf";
  width?: number;
  height?: number;
  publicId?: string;
}

export interface PostRow {
  id: string;
  author_id: string;
  type: PostType;
  caption: string | null;
  code_language: string | null;
  code_snippet: string | null;
  skill_category: string | null;
  tags: string[];
  location: string | null;
  thumbnail_url: string | null;
  media: PostMediaItem[];
  github_url: string | null;
  project_url: string | null;
  status: PostStatus;
  scheduled_at: string | null;
  like_count: number;
  comment_count: number;
  save_count: number;
  search_vector: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostLikeRow {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  body: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostSaveRow {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  is_group: boolean;
  title: string | null;
  created_by: string;
  created_at: string;
}

export interface ConversationParticipantRow {
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  is_archived: boolean;
}

export interface MessageAttachment {
  url: string;
  type: "image" | "video" | "audio" | "pdf";
  publicId?: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment: MessageAttachment | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType = "follow" | "like" | "comment" | "reply";

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export type ReportTargetType = "post" | "comment" | "profile" | "message";
export type ReportReason = "spam" | "harassment" | "inappropriate_content" | "fake_account" | "impersonation" | "other";
export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; username: string; full_name: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      profile_skills: {
        Row: ProfileSkillRow;
        Insert: Partial<ProfileSkillRow> & { profile_id: string; skill_name: string; category: string };
        Update: Partial<ProfileSkillRow>;
        Relationships: [];
      };
      profile_education: {
        Row: ProfileEducationRow;
        Insert: Partial<ProfileEducationRow> & { profile_id: string; institution: string };
        Update: Partial<ProfileEducationRow>;
        Relationships: [];
      };
      profile_experience: {
        Row: ProfileExperienceRow;
        Insert: Partial<ProfileExperienceRow> & { profile_id: string; organization: string; role: string };
        Update: Partial<ProfileExperienceRow>;
        Relationships: [];
      };
      follows: {
        Row: FollowRow;
        Insert: FollowRow;
        Update: Partial<FollowRow>;
        Relationships: [];
      };
      posts: {
        Row: PostRow;
        Insert: Partial<PostRow> & { author_id: string };
        Update: Partial<PostRow>;
        Relationships: [];
      };
      post_likes: {
        Row: PostLikeRow;
        Insert: PostLikeRow;
        Update: Partial<PostLikeRow>;
        Relationships: [];
      };
      post_comments: {
        Row: PostCommentRow;
        Insert: Partial<PostCommentRow> & { post_id: string; author_id: string; body: string };
        Update: Partial<PostCommentRow>;
        Relationships: [];
      };
      post_saves: {
        Row: PostSaveRow;
        Insert: PostSaveRow;
        Update: Partial<PostSaveRow>;
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: Partial<ConversationRow> & { created_by: string };
        Update: Partial<ConversationRow>;
        Relationships: [];
      };
      conversation_participants: {
        Row: ConversationParticipantRow;
        Insert: Partial<ConversationParticipantRow> & { conversation_id: string; user_id: string };
        Update: Partial<ConversationParticipantRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Partial<MessageRow> & { conversation_id: string; sender_id: string };
        Update: Partial<MessageRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow> & { user_id: string; type: NotificationType; actor_id: string };
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      reports: {
        Row: ReportRow;
        Insert: Partial<ReportRow> & {
          reporter_id: string;
          target_type: ReportTargetType;
          target_id: string;
          reason: ReportReason;
        };
        Update: Partial<ReportRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      account_type: AccountType;
      availability_status: AvailabilityStatus;
      proficiency_level: ProfileSkillRow["proficiency"];
      post_type: PostType;
      post_status: PostStatus;
      notification_type: NotificationType;
      report_target_type: ReportTargetType;
      report_reason: ReportReason;
      report_status: ReportStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
