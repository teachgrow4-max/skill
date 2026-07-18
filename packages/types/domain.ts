import type {
  AccountType,
  ApplicationStatus,
  AvailabilityStatus,
  MessageAttachment,
  NotificationType,
  OpportunityKind,
  OpportunityStatus,
  PostMediaItem,
  PostStatus,
  PostType,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  SessionStatus,
} from "./database";

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
  resumeUrl: string | null;
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

export interface AuthorSummary {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  accountType: AccountType;
  isVerified: boolean;
}

export interface Post {
  id: string;
  author: AuthorSummary;
  type: PostType;
  caption: string | null;
  codeLanguage: string | null;
  codeSnippet: string | null;
  skillCategory: string | null;
  tags: string[];
  location: string | null;
  thumbnailUrl: string | null;
  media: PostMediaItem[];
  githubUrl: string | null;
  projectUrl: string | null;
  status: PostStatus;
  scheduledAt: string | null;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: AuthorSummary;
  parentCommentId: string | null;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: AuthorSummary;
  body: string | null;
  attachment: MessageAttachment | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  title: string | null;
  participants: AuthorSummary[];
  lastMessage: Message | null;
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  actor: AuthorSummary;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  author: AuthorSummary;
  kind: OpportunityKind;
  title: string;
  description: string;
  skillCategory: string | null;
  requiredSkills: string[];
  location: string | null;
  isRemote: boolean;
  compensation: string | null;
  deadline: string | null;
  eventDate: string | null;
  status: OpportunityStatus;
  applicationCount: number;
  hasApplied: boolean;
  createdAt: string;
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  applicant: AuthorSummary;
  status: ApplicationStatus;
  coverNote: string | null;
  resumeUrl: string | null;
  createdAt: string;
}

export interface MentorAvailabilitySlot {
  id: string;
  mentorId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface MentorSession {
  id: string;
  mentor: AuthorSummary;
  student: AuthorSummary;
  scheduledAt: string;
  durationMinutes: number;
  status: SessionStatus;
  notes: string | null;
  createdAt: string;
}

export interface MentorReview {
  id: string;
  sessionId: string;
  student: AuthorSummary;
  rating: number;
  comment: string | null;
  createdAt: string;
}
