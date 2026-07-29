/**
 * Hand-maintained mirror of the Supabase schema defined in
 * packages/database/migrations. Keep in sync when migrations change.
 * (Regenerate with `supabase gen types typescript` once a live project exists.)
 */

export type AccountType =
  "student" | "professional" | "mentor" | "company" | "college" | "admin" | "moderator";

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
  is_private: boolean;
  skill_coins: number;
  level: number;
  onboarding_completed: boolean;
  resume_url: string | null;
  streak_count: number;
  last_active_date: string | null;
  search_vector: string | null;
  referral_code: string;
  referred_by: string | null;
  total_referrals: number;
  has_claimed_welcome: boolean;
  has_posted_first_reel: boolean;
  has_received_first_like: boolean;
  has_reached_100_likes: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillCoinEventRow {
  id: string;
  profile_id: string;
  amount: number;
  reason: string;
  created_at: string;
}

export interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface ProfileBadgeRow {
  profile_id: string;
  badge_id: string;
  earned_at: string;
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

export type FollowRequestStatus = "pending" | "accepted" | "declined";

export interface FollowRequestRow {
  requester_id: string;
  target_id: string;
  status: FollowRequestStatus;
  created_at: string;
  responded_at: string | null;
}

export type PostType =
  "text" | "image" | "carousel" | "video" | "pdf" | "code" | "github_link" | "project_link";

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
  hide_like_count: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  pinned_at: string | null;
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

export interface MessageReactionRow {
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export type NotificationType = "follow" | "like" | "comment" | "reply" | "follow_request" | "follow_accepted";

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
export type ReportReason =
  "spam" | "harassment" | "inappropriate_content" | "fake_account" | "impersonation" | "other";
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

export type OpportunityKind = "job" | "internship" | "competition" | "event" | "scholarship";
export type OpportunityStatus = "draft" | "published" | "closed";

export interface OpportunityRow {
  id: string;
  author_id: string;
  kind: OpportunityKind;
  title: string;
  description: string;
  skill_category: string | null;
  required_skills: string[];
  location: string | null;
  is_remote: boolean;
  compensation: string | null;
  deadline: string | null;
  event_date: string | null;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = "submitted" | "shortlisted" | "rejected" | "accepted";

export interface OpportunityApplicationRow {
  id: string;
  opportunity_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateBookmarkRow {
  owner_id: string;
  candidate_id: string;
  created_at: string;
}

export type VerificationStatus = "pending" | "approved" | "rejected";

export interface VerificationRequestRow {
  id: string;
  profile_id: string;
  organization_name: string;
  proof_url: string | null;
  notes: string | null;
  status: VerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface MentorAvailabilityRow {
  id: string;
  mentor_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

export type SessionStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface MentorSessionRow {
  id: string;
  mentor_id: string;
  student_id: string;
  availability_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MentorReviewRow {
  id: string;
  session_id: string;
  mentor_id: string;
  student_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export type StoryMediaType = "image" | "video";
export type StorySticker = "none" | "poll" | "question" | "quiz" | "countdown" | "emoji_slider";

export interface StoryPollData {
  question: string;
  options: string[];
}

export interface StoryQuestionData {
  prompt: string;
}

export interface StoryQuizData {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface StoryCountdownData {
  label: string;
  targetIso: string;
}

export interface StoryEmojiSliderData {
  question: string;
  emoji: string;
}

export type StoryStickerData =
  | StoryPollData
  | StoryQuestionData
  | StoryQuizData
  | StoryCountdownData
  | StoryEmojiSliderData
  | Record<string, unknown>;

export interface StoryRow {
  id: string;
  author_id: string;
  media_url: string;
  media_type: StoryMediaType;
  caption: string | null;
  sticker_type: StorySticker;
  sticker_data: StoryStickerData;
  created_at: string;
  expires_at: string;
}

export interface StoryViewRow {
  story_id: string;
  viewer_id: string;
  viewed_at: string;
}

export interface StoryResponseRow {
  id: string;
  story_id: string;
  viewer_id: string;
  response: Json;
  created_at: string;
}

export type ProfileField = "full_name" | "username";

export interface ProfileFieldChangeRow {
  id: string;
  profile_id: string;
  field: ProfileField;
  changed_at: string;
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
      profile_field_changes: {
        Row: ProfileFieldChangeRow;
        Insert: Partial<ProfileFieldChangeRow> & { profile_id: string; field: ProfileField };
        Update: Partial<ProfileFieldChangeRow>;
        Relationships: [];
      };
      skill_coin_events: {
        Row: SkillCoinEventRow;
        Insert: Partial<SkillCoinEventRow> & { profile_id: string; amount: number; reason: string };
        Update: Partial<SkillCoinEventRow>;
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
      follow_requests: {
        Row: FollowRequestRow;
        Insert: Partial<FollowRequestRow> & { requester_id: string; target_id: string };
        Update: Partial<FollowRequestRow>;
        Relationships: [];
      };
      badges: {
        Row: BadgeRow;
        Insert: Partial<BadgeRow> & { slug: string; name: string; description: string; icon: string };
        Update: Partial<BadgeRow>;
        Relationships: [];
      };
      profile_badges: {
        Row: ProfileBadgeRow;
        Insert: Partial<ProfileBadgeRow> & { profile_id: string; badge_id: string };
        Update: Partial<ProfileBadgeRow>;
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
      message_reactions: {
        Row: MessageReactionRow;
        Insert: MessageReactionRow;
        Update: Partial<MessageReactionRow>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: PushSubscriptionRow;
        Insert: Partial<PushSubscriptionRow> & {
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
        };
        Update: Partial<PushSubscriptionRow>;
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
      opportunities: {
        Row: OpportunityRow;
        Insert: Partial<OpportunityRow> & {
          author_id: string;
          kind: OpportunityKind;
          title: string;
          description: string;
        };
        Update: Partial<OpportunityRow>;
        Relationships: [];
      };
      opportunity_applications: {
        Row: OpportunityApplicationRow;
        Insert: Partial<OpportunityApplicationRow> & { opportunity_id: string; applicant_id: string };
        Update: Partial<OpportunityApplicationRow>;
        Relationships: [];
      };
      candidate_bookmarks: {
        Row: CandidateBookmarkRow;
        Insert: CandidateBookmarkRow;
        Update: Partial<CandidateBookmarkRow>;
        Relationships: [];
      };
      verification_requests: {
        Row: VerificationRequestRow;
        Insert: Partial<VerificationRequestRow> & { profile_id: string; organization_name: string };
        Update: Partial<VerificationRequestRow>;
        Relationships: [];
      };
      mentor_availability: {
        Row: MentorAvailabilityRow;
        Insert: Partial<MentorAvailabilityRow> & { mentor_id: string; start_time: string; end_time: string };
        Update: Partial<MentorAvailabilityRow>;
        Relationships: [];
      };
      mentor_sessions: {
        Row: MentorSessionRow;
        Insert: Partial<MentorSessionRow> & { mentor_id: string; student_id: string; scheduled_at: string };
        Update: Partial<MentorSessionRow>;
        Relationships: [];
      };
      mentor_reviews: {
        Row: MentorReviewRow;
        Insert: Partial<MentorReviewRow> & {
          session_id: string;
          mentor_id: string;
          student_id: string;
          rating: number;
        };
        Update: Partial<MentorReviewRow>;
        Relationships: [];
      };
      stories: {
        Row: StoryRow;
        Insert: Partial<StoryRow> & { author_id: string; media_url: string; media_type: StoryMediaType };
        Update: Partial<StoryRow>;
        Relationships: [];
      };
      story_views: {
        Row: StoryViewRow;
        Insert: StoryViewRow;
        Update: Partial<StoryViewRow>;
        Relationships: [];
      };
      story_responses: {
        Row: StoryResponseRow;
        Insert: Partial<StoryResponseRow> & { story_id: string; viewer_id: string; response: Json };
        Update: Partial<StoryResponseRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_complete_profile_bonus: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
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
      opportunity_kind: OpportunityKind;
      opportunity_status: OpportunityStatus;
      application_status: ApplicationStatus;
      verification_status: VerificationStatus;
      session_status: SessionStatus;
      story_media_type: StoryMediaType;
      story_sticker_type: StorySticker;
      follow_request_status: FollowRequestStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
