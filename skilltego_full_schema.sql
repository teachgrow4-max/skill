-- Skilltego — combined schema (migrations 0001-0011).
-- Generated for a one-time paste into Supabase SQL Editor on a fresh project.
-- Source of truth remains the individual files in packages/database/migrations/.

-- =============================================================================
-- 0001_init.sql
-- =============================================================================
-- Skilltego — Phase 1 schema: profiles, skills, education, experience, follows.
-- Run against a Supabase project via the SQL editor or `supabase db push`.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type account_type as enum (
  'student',
  'professional',
  'mentor',
  'company',
  'college',
  'admin',
  'moderator'
);

create type availability_status as enum (
  'available',
  'open_to_offers',
  'not_available'
);

create type proficiency_level as enum (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  full_name text not null,
  account_type account_type not null default 'student',
  avatar_url text,
  cover_url text,
  bio text,
  country text,
  state text,
  city text,
  school text,
  college text,
  company text,
  website text,
  socials jsonb not null default '{}'::jsonb,
  languages text[] not null default '{}'::text[],
  availability availability_status not null default 'available',
  is_verified boolean not null default false,
  xp integer not null default 0,
  coins integer not null default 0,
  level integer not null default 1,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint username_length check (char_length(username) between 3 and 30),
  constraint username_format check (username ~ '^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$'),
  constraint bio_length check (bio is null or char_length(bio) <= 500)
);

create index profiles_username_idx on public.profiles (username);
create index profiles_account_type_idx on public.profiles (account_type);

-- ---------------------------------------------------------------------------
-- profile_skills
-- ---------------------------------------------------------------------------
create table public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_name text not null,
  category text not null,
  proficiency proficiency_level not null default 'beginner',
  years_experience numeric(4, 1),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),

  constraint skill_name_length check (char_length(skill_name) between 1 and 60)
);

create index profile_skills_profile_id_idx on public.profile_skills (profile_id);
create unique index profile_skills_unique_per_profile on public.profile_skills (profile_id, lower(skill_name));

-- ---------------------------------------------------------------------------
-- profile_education
-- ---------------------------------------------------------------------------
create table public.profile_education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  institution text not null,
  degree text,
  field_of_study text,
  start_year integer,
  end_year integer,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create index profile_education_profile_id_idx on public.profile_education (profile_id);

-- ---------------------------------------------------------------------------
-- profile_experience
-- ---------------------------------------------------------------------------
create table public.profile_experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  organization text not null,
  role text not null,
  description text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create index profile_experience_profile_id_idx on public.profile_experience (profile_id);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create index follows_following_id_idx on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  base_username := lower(regexp_replace(split_part(coalesce(new.email, 'user'), '@', 1), '[^a-z0-9_]', '_', 'g'));
  base_username := left(regexp_replace(base_username, '_{2,}', '_', 'g'), 24);
  if base_username is null or length(base_username) < 3 then
    base_username := 'user_' || left(replace(new.id::text, '-', ''), 8);
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := left(base_username, 24) || '_' || suffix::text;
  end loop;

  insert into public.profiles (id, username, full_name, avatar_url, onboarding_completed)
  values (
    new.id,
    final_username,
    display_name,
    new.raw_user_meta_data->>'avatar_url',
    false
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_education enable row level security;
alter table public.profile_experience enable row level security;
alter table public.follows enable row level security;

-- profiles: publicly readable, only the owner can write
create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- profile inserts happen exclusively via the handle_new_user trigger (security definer)

-- profile_skills
create policy "profile_skills_select_all" on public.profile_skills
  for select using (true);

create policy "profile_skills_insert_own" on public.profile_skills
  for insert with check (auth.uid() = profile_id);

create policy "profile_skills_update_own" on public.profile_skills
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "profile_skills_delete_own" on public.profile_skills
  for delete using (auth.uid() = profile_id);

-- profile_education
create policy "profile_education_select_all" on public.profile_education
  for select using (true);

create policy "profile_education_insert_own" on public.profile_education
  for insert with check (auth.uid() = profile_id);

create policy "profile_education_update_own" on public.profile_education
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "profile_education_delete_own" on public.profile_education
  for delete using (auth.uid() = profile_id);

-- profile_experience
create policy "profile_experience_select_all" on public.profile_experience
  for select using (true);

create policy "profile_experience_insert_own" on public.profile_experience
  for insert with check (auth.uid() = profile_id);

create policy "profile_experience_update_own" on public.profile_experience
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "profile_experience_delete_own" on public.profile_experience
  for delete using (auth.uid() = profile_id);

-- follows
create policy "follows_select_all" on public.follows
  for select using (true);

create policy "follows_insert_own" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "follows_delete_own" on public.follows
  for delete using (auth.uid() = follower_id);

-- =============================================================================
-- 0002_posts.sql
-- =============================================================================
-- Skilltego — Phase 2 schema: posts, likes, comments, saves, search.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type post_type as enum (
  'text',
  'image',
  'carousel',
  'video',
  'pdf',
  'code',
  'github_link',
  'project_link'
);

create type post_status as enum (
  'draft',
  'scheduled',
  'published'
);

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  type post_type not null default 'text',
  caption text,
  code_language text,
  code_snippet text,
  skill_category text,
  tags text[] not null default '{}'::text[],
  location text,
  thumbnail_url text,
  media jsonb not null default '[]'::jsonb,
  github_url text,
  project_url text,
  status post_status not null default 'published',
  scheduled_at timestamptz,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  save_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint caption_length check (caption is null or char_length(caption) <= 3000),
  constraint tags_max check (array_length(tags, 1) is null or array_length(tags, 1) <= 10)
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_status_created_idx on public.posts (status, created_at desc);
create index posts_skill_category_idx on public.posts (skill_category);
create index posts_tags_idx on public.posts using gin (tags);

-- search_vector is trigger-maintained rather than a generated column: Postgres's
-- generated-column immutability check rejects to_tsvector-based expressions
-- outright in some versions, even though the function itself is immutable.
-- A trigger runs at write time and isn't subject to that static check.
alter table public.posts add column search_vector tsvector;

create function public.posts_set_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.caption, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.skill_category, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(new.tags, ' ')), 'B');
  return new;
end;
$$;

create trigger posts_set_search_vector
  before insert or update on public.posts
  for each row
  execute function public.posts_set_search_vector();

create index posts_search_vector_idx on public.posts using gin (search_vector);

create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles search vector (added here so Phase 2 search covers people too)
-- ---------------------------------------------------------------------------
alter table public.profiles add column search_vector tsvector;

create function public.profiles_set_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.full_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.bio, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.company, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.college, '')), 'B');
  return new;
end;
$$;

create trigger profiles_set_search_vector
  before insert or update on public.profiles
  for each row
  execute function public.profiles_set_search_vector();

create index profiles_search_vector_idx on public.profiles using gin (search_vector);

-- ---------------------------------------------------------------------------
-- post_likes
-- ---------------------------------------------------------------------------
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_likes_user_id_idx on public.post_likes (user_id);

-- ---------------------------------------------------------------------------
-- post_comments
-- ---------------------------------------------------------------------------
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.post_comments (id) on delete cascade,
  body text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint comment_body_length check (char_length(body) between 1 and 1000)
);

create index post_comments_post_id_idx on public.post_comments (post_id, created_at);
create index post_comments_parent_id_idx on public.post_comments (parent_comment_id);

create trigger post_comments_set_updated_at
  before update on public.post_comments
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- post_saves (bookmarks)
-- ---------------------------------------------------------------------------
create table public.post_saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index post_saves_user_id_idx on public.post_saves (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Denormalized counters kept in sync via triggers
-- ---------------------------------------------------------------------------
create function public.increment_post_like_count()
returns trigger
language plpgsql
as $$
begin
  update public.posts set like_count = like_count + 1 where id = new.post_id;
  return new;
end;
$$;

create function public.decrement_post_like_count()
returns trigger
language plpgsql
as $$
begin
  update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

create trigger post_likes_increment
  after insert on public.post_likes
  for each row execute function public.increment_post_like_count();

create trigger post_likes_decrement
  after delete on public.post_likes
  for each row execute function public.decrement_post_like_count();

create function public.increment_post_comment_count()
returns trigger
language plpgsql
as $$
begin
  update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  return new;
end;
$$;

create function public.decrement_post_comment_count()
returns trigger
language plpgsql
as $$
begin
  update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

create trigger post_comments_increment
  after insert on public.post_comments
  for each row execute function public.increment_post_comment_count();

create trigger post_comments_decrement
  after delete on public.post_comments
  for each row execute function public.decrement_post_comment_count();

create function public.increment_post_save_count()
returns trigger
language plpgsql
as $$
begin
  update public.posts set save_count = save_count + 1 where id = new.post_id;
  return new;
end;
$$;

create function public.decrement_post_save_count()
returns trigger
language plpgsql
as $$
begin
  update public.posts set save_count = greatest(save_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

create trigger post_saves_increment
  after insert on public.post_saves
  for each row execute function public.increment_post_save_count();

create trigger post_saves_decrement
  after delete on public.post_saves
  for each row execute function public.decrement_post_save_count();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.post_saves enable row level security;

-- posts: published posts are public; drafts/scheduled are only visible to their author
create policy "posts_select_published_or_own" on public.posts
  for select using (status = 'published' or auth.uid() = author_id);

create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "posts_update_own" on public.posts
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "posts_delete_own" on public.posts
  for delete using (auth.uid() = author_id);

-- post_likes
create policy "post_likes_select_all" on public.post_likes
  for select using (true);

create policy "post_likes_insert_own" on public.post_likes
  for insert with check (auth.uid() = user_id);

create policy "post_likes_delete_own" on public.post_likes
  for delete using (auth.uid() = user_id);

-- post_comments
create policy "post_comments_select_all" on public.post_comments
  for select using (true);

create policy "post_comments_insert_own" on public.post_comments
  for insert with check (auth.uid() = author_id);

create policy "post_comments_update_own" on public.post_comments
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "post_comments_delete_own" on public.post_comments
  for delete using (auth.uid() = author_id);

-- post_saves
create policy "post_saves_select_own" on public.post_saves
  for select using (auth.uid() = user_id);

create policy "post_saves_insert_own" on public.post_saves
  for insert with check (auth.uid() = user_id);

create policy "post_saves_delete_own" on public.post_saves
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 0003_messaging_notifications.sql
-- =============================================================================
-- Skilltego — Phase 3 schema: messaging, notifications, reports.

-- ---------------------------------------------------------------------------
-- Helper: is the given user a moderator or admin?
-- ---------------------------------------------------------------------------
create function public.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and account_type in ('admin', 'moderator')
  );
$$;

-- ---------------------------------------------------------------------------
-- conversations / conversation_participants / messages
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  is_muted boolean not null default false,
  is_archived boolean not null default false,
  primary key (conversation_id, user_id)
);

create index conversation_participants_user_id_idx on public.conversation_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text,
  attachment jsonb,
  is_edited boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint message_body_length check (body is null or char_length(body) <= 4000),
  constraint message_has_content check (body is not null or attachment is not null)
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

create trigger messages_set_updated_at
  before update on public.messages
  for each row
  execute function public.set_updated_at();

-- Helper used by RLS policies: is the current user a participant in this conversation?
create function public.is_conversation_participant(conversation uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = conversation and user_id = uid
  );
$$;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create type notification_type as enum ('follow', 'like', 'comment', 'reply');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where not is_read;

-- ---------------------------------------------------------------------------
-- Auto-create notifications via triggers (security definer — bypasses RLS)
-- ---------------------------------------------------------------------------
create function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, actor_id, entity_type, entity_id)
  values (new.following_id, 'follow', new.follower_id, 'profile', new.follower_id);
  return new;
end;
$$;

create trigger follows_notify
  after insert on public.follows
  for each row execute function public.notify_on_follow();

create function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;

  if post_author is not null and post_author <> new.user_id then
    insert into public.notifications (user_id, type, actor_id, entity_type, entity_id)
    values (post_author, 'like', new.user_id, 'post', new.post_id);
  end if;

  return new;
end;
$$;

create trigger post_likes_notify
  after insert on public.post_likes
  for each row execute function public.notify_on_like();

create function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  parent_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;

  if post_author is not null and post_author <> new.author_id then
    insert into public.notifications (user_id, type, actor_id, entity_type, entity_id)
    values (post_author, 'comment', new.author_id, 'post', new.post_id);
  end if;

  if new.parent_comment_id is not null then
    select author_id into parent_author from public.post_comments where id = new.parent_comment_id;

    if parent_author is not null and parent_author <> new.author_id and parent_author <> post_author then
      insert into public.notifications (user_id, type, actor_id, entity_type, entity_id)
      values (parent_author, 'reply', new.author_id, 'comment', new.id);
    end if;
  end if;

  return new;
end;
$$;

create trigger post_comments_notify
  after insert on public.post_comments
  for each row execute function public.notify_on_comment();

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create type report_target_type as enum ('post', 'comment', 'profile', 'message');
create type report_reason as enum ('spam', 'harassment', 'inappropriate_content', 'fake_account', 'impersonation', 'other');
create type report_status as enum ('pending', 'reviewed', 'actioned', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type report_target_type not null,
  target_id uuid not null,
  reason report_reason not null,
  details text,
  status report_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),

  constraint report_details_length check (details is null or char_length(details) <= 1000)
);

create index reports_status_idx on public.reports (status, created_at);
create index reports_target_idx on public.reports (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- conversations: visible to participants only
create policy "conversations_select_participant" on public.conversations
  for select using (public.is_conversation_participant(id, auth.uid()));

create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = created_by);

-- conversation_participants: visible to fellow participants; a user can add themself when created
create policy "conversation_participants_select_fellow" on public.conversation_participants
  for select using (public.is_conversation_participant(conversation_id, auth.uid()));

create policy "conversation_participants_insert_own_or_creator" on public.conversation_participants
  for insert with check (
    auth.uid() = user_id
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.created_by = auth.uid())
  );

create policy "conversation_participants_update_own" on public.conversation_participants
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- messages: visible to participants; only the sender can insert as themself
create policy "messages_select_participant" on public.messages
  for select using (public.is_conversation_participant(conversation_id, auth.uid()));

create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = sender_id and public.is_conversation_participant(conversation_id, auth.uid()));

create policy "messages_update_own" on public.messages
  for update using (auth.uid() = sender_id) with check (auth.uid() = sender_id);

-- notifications: users only see and manage their own; inserts happen via triggers only
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reports: reporters can create and see their own reports; moderators see and manage all
create policy "reports_select_own_or_moderator" on public.reports
  for select using (auth.uid() = reporter_id or public.is_moderator(auth.uid()));

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_update_moderator" on public.reports
  for update using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));

-- =============================================================================
-- 0004_opportunities_dashboards.sql
-- =============================================================================
-- Skilltego — Phase 4 schema: opportunities (jobs/internships/competitions/
-- events/scholarships), candidate bookmarks, verification, mentor booking.

-- ---------------------------------------------------------------------------
-- profiles: resume for company/recruiter downloads
-- ---------------------------------------------------------------------------
alter table public.profiles add column resume_url text;

-- ---------------------------------------------------------------------------
-- opportunities (posted by company or college accounts)
-- ---------------------------------------------------------------------------
create type opportunity_kind as enum ('job', 'internship', 'competition', 'event', 'scholarship');
create type opportunity_status as enum ('draft', 'published', 'closed');

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind opportunity_kind not null,
  title text not null,
  description text not null,
  skill_category text,
  required_skills text[] not null default '{}'::text[],
  location text,
  is_remote boolean not null default false,
  compensation text,
  deadline timestamptz,
  event_date timestamptz,
  status opportunity_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint opportunity_title_length check (char_length(title) between 3 and 200),
  constraint opportunity_description_length check (char_length(description) <= 5000)
);

create index opportunities_author_id_idx on public.opportunities (author_id);
create index opportunities_kind_status_idx on public.opportunities (kind, status, created_at desc);
create index opportunities_required_skills_idx on public.opportunities using gin (required_skills);

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- opportunity_applications (job/internship applications and event/
-- competition registrations share the same shape)
-- ---------------------------------------------------------------------------
create type application_status as enum ('submitted', 'shortlisted', 'rejected', 'accepted');

create table public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  status application_status not null default 'submitted',
  cover_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cover_note_length check (cover_note is null or char_length(cover_note) <= 2000),
  unique (opportunity_id, applicant_id)
);

create index opportunity_applications_opportunity_id_idx on public.opportunity_applications (opportunity_id);
create index opportunity_applications_applicant_id_idx on public.opportunity_applications (applicant_id);

create trigger opportunity_applications_set_updated_at
  before update on public.opportunity_applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- candidate_bookmarks (companies/colleges bookmarking candidate profiles)
-- ---------------------------------------------------------------------------
create table public.candidate_bookmarks (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, candidate_id)
);

-- ---------------------------------------------------------------------------
-- verification_requests (company/college/mentor verification)
-- ---------------------------------------------------------------------------
create type verification_status as enum ('pending', 'approved', 'rejected');

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  organization_name text not null,
  proof_url text,
  notes text,
  status verification_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index verification_requests_status_idx on public.verification_requests (status, created_at);

-- ---------------------------------------------------------------------------
-- mentor availability, sessions, reviews
-- ---------------------------------------------------------------------------
create type session_status as enum ('requested', 'confirmed', 'completed', 'cancelled');

create table public.mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),

  constraint availability_time_order check (end_time > start_time)
);

create index mentor_availability_mentor_id_idx on public.mentor_availability (mentor_id, start_time);

create table public.mentor_sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  availability_id uuid references public.mentor_availability (id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  status session_status not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mentor_sessions_mentor_id_idx on public.mentor_sessions (mentor_id, scheduled_at);
create index mentor_sessions_student_id_idx on public.mentor_sessions (student_id, scheduled_at);

create trigger mentor_sessions_set_updated_at
  before update on public.mentor_sessions
  for each row execute function public.set_updated_at();

create table public.mentor_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentor_sessions (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),

  constraint rating_range check (rating between 1 and 5),
  unique (session_id)
);

create index mentor_reviews_mentor_id_idx on public.mentor_reviews (mentor_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.opportunities enable row level security;
alter table public.opportunity_applications enable row level security;
alter table public.candidate_bookmarks enable row level security;
alter table public.verification_requests enable row level security;
alter table public.mentor_availability enable row level security;
alter table public.mentor_sessions enable row level security;
alter table public.mentor_reviews enable row level security;

-- opportunities: published are public; drafts visible to author only
create policy "opportunities_select_published_or_own" on public.opportunities
  for select using (status = 'published' or auth.uid() = author_id);

create policy "opportunities_insert_own" on public.opportunities
  for insert with check (auth.uid() = author_id);

create policy "opportunities_update_own" on public.opportunities
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "opportunities_delete_own" on public.opportunities
  for delete using (auth.uid() = author_id);

-- opportunity_applications: applicant sees own; opportunity author sees applications to their postings
create policy "opportunity_applications_select_own_or_author" on public.opportunity_applications
  for select using (
    auth.uid() = applicant_id
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.author_id = auth.uid())
  );

create policy "opportunity_applications_insert_own" on public.opportunity_applications
  for insert with check (auth.uid() = applicant_id);

create policy "opportunity_applications_update_author_or_applicant" on public.opportunity_applications
  for update using (
    auth.uid() = applicant_id
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.author_id = auth.uid())
  ) with check (
    auth.uid() = applicant_id
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.author_id = auth.uid())
  );

create policy "opportunity_applications_delete_own" on public.opportunity_applications
  for delete using (auth.uid() = applicant_id);

-- candidate_bookmarks: owner-only
create policy "candidate_bookmarks_select_own" on public.candidate_bookmarks
  for select using (auth.uid() = owner_id);

create policy "candidate_bookmarks_insert_own" on public.candidate_bookmarks
  for insert with check (auth.uid() = owner_id);

create policy "candidate_bookmarks_delete_own" on public.candidate_bookmarks
  for delete using (auth.uid() = owner_id);

-- verification_requests: requester sees own; moderators see and manage all
create policy "verification_requests_select_own_or_moderator" on public.verification_requests
  for select using (auth.uid() = profile_id or public.is_moderator(auth.uid()));

create policy "verification_requests_insert_own" on public.verification_requests
  for insert with check (auth.uid() = profile_id);

create policy "verification_requests_update_moderator" on public.verification_requests
  for update using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));

-- mentor_availability: publicly viewable (so students can book); only the mentor manages their own
create policy "mentor_availability_select_all" on public.mentor_availability
  for select using (true);

create policy "mentor_availability_insert_own" on public.mentor_availability
  for insert with check (auth.uid() = mentor_id);

create policy "mentor_availability_update_own" on public.mentor_availability
  for update using (auth.uid() = mentor_id) with check (auth.uid() = mentor_id);

create policy "mentor_availability_delete_own" on public.mentor_availability
  for delete using (auth.uid() = mentor_id);

-- mentor_sessions: visible to mentor and student involved
create policy "mentor_sessions_select_participant" on public.mentor_sessions
  for select using (auth.uid() = mentor_id or auth.uid() = student_id);

create policy "mentor_sessions_insert_student" on public.mentor_sessions
  for insert with check (auth.uid() = student_id);

create policy "mentor_sessions_update_participant" on public.mentor_sessions
  for update using (auth.uid() = mentor_id or auth.uid() = student_id)
  with check (auth.uid() = mentor_id or auth.uid() = student_id);

-- mentor_reviews: publicly viewable; only the student in a completed session may create their review
create policy "mentor_reviews_select_all" on public.mentor_reviews
  for select using (true);

create policy "mentor_reviews_insert_student" on public.mentor_reviews
  for insert with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.mentor_sessions s
      where s.id = session_id and s.student_id = auth.uid() and s.status = 'completed'
    )
  );

-- =============================================================================
-- 0005_admin.sql
-- =============================================================================
-- Skilltego — Phase 5 schema: admin RLS support.

create function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and account_type = 'admin'
  );
$$;

-- Admins can update any profile (verification, account type corrections, moderation actions).
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Admins can delete any post (content moderation escalation beyond author self-delete).
create policy "posts_delete_admin" on public.posts
  for delete using (public.is_admin(auth.uid()));

-- Admins can delete any comment.
create policy "post_comments_delete_admin" on public.post_comments
  for delete using (public.is_admin(auth.uid()));

-- =============================================================================
-- 0006_stories.sql
-- =============================================================================
-- Skilltego — Phase 6: 24-hour Stories.

create type story_media_type as enum ('image', 'video');
create type story_sticker_type as enum ('none', 'poll', 'question', 'quiz', 'countdown', 'emoji_slider');

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  media_url text not null,
  media_type story_media_type not null,
  caption text,
  sticker_type story_sticker_type not null default 'none',
  sticker_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),

  constraint story_caption_length check (caption is null or char_length(caption) <= 200)
);

create index stories_author_id_idx on public.stories (author_id, created_at desc);
create index stories_expires_at_idx on public.stories (expires_at);

create table public.story_views (
  story_id uuid not null references public.stories (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create table public.story_responses (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  viewer_id uuid not null references public.profiles (id) on delete cascade,
  response jsonb not null,
  created_at timestamptz not null default now(),

  unique (story_id, viewer_id)
);

alter table public.stories enable row level security;
alter table public.story_views enable row level security;
alter table public.story_responses enable row level security;

-- stories: publicly visible while not expired, or always visible to their own author
create policy "stories_select_active_or_own" on public.stories
  for select using (expires_at > now() or auth.uid() = author_id);

create policy "stories_insert_own" on public.stories
  for insert with check (auth.uid() = author_id);

create policy "stories_delete_own" on public.stories
  for delete using (auth.uid() = author_id);

-- story_views: viewers see their own view records; a story's author sees who viewed it
create policy "story_views_select_own_or_author" on public.story_views
  for select using (
    auth.uid() = viewer_id
    or exists (select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
  );

create policy "story_views_insert_own" on public.story_views
  for insert with check (auth.uid() = viewer_id);

-- story_responses: viewer sees their own response; story author sees all responses (poll/question results)
create policy "story_responses_select_own_or_author" on public.story_responses
  for select using (
    auth.uid() = viewer_id
    or exists (select 1 from public.stories s where s.id = story_id and s.author_id = auth.uid())
  );

create policy "story_responses_insert_own" on public.story_responses
  for insert with check (auth.uid() = viewer_id);

-- =============================================================================
-- 0007_message_reactions.sql
-- =============================================================================
-- Skilltego — Phase 6: message reactions (group chat + voice notes reuse
-- the existing conversations/messages schema from 0003).

create table public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),

  primary key (message_id, user_id),
  constraint emoji_length check (char_length(emoji) between 1 and 8)
);

create index message_reactions_message_id_idx on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;

-- visible to conversation participants only
create policy "message_reactions_select_participant" on public.message_reactions
  for select using (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

create policy "message_reactions_insert_own" on public.message_reactions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

create policy "message_reactions_delete_own" on public.message_reactions
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 0008_private_accounts.sql
-- =============================================================================
-- Skilltego — Phase 7: private accounts + follow requests.

alter type notification_type add value if not exists 'follow_request';
alter type notification_type add value if not exists 'follow_accepted';

alter table public.profiles add column is_private boolean not null default false;

create type follow_request_status as enum ('pending', 'accepted', 'declined');

create table public.follow_requests (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  status follow_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,

  primary key (requester_id, target_id),
  constraint no_self_request check (requester_id <> target_id)
);

create index follow_requests_target_pending_idx on public.follow_requests (target_id) where status = 'pending';

alter table public.follow_requests enable row level security;

create policy "follow_requests_select_own" on public.follow_requests
  for select using (auth.uid() = requester_id or auth.uid() = target_id);

create policy "follow_requests_insert_own" on public.follow_requests
  for insert with check (auth.uid() = requester_id);

create policy "follow_requests_update_target" on public.follow_requests
  for update using (auth.uid() = target_id) with check (auth.uid() = target_id);

create policy "follow_requests_delete_own" on public.follow_requests
  for delete using (auth.uid() = requester_id or auth.uid() = target_id);

-- ---------------------------------------------------------------------------
-- Notify + auto-follow on request / acceptance
-- ---------------------------------------------------------------------------
create function public.notify_on_follow_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, actor_id, entity_type, entity_id)
  values (new.target_id, 'follow_request', new.requester_id, 'profile', new.requester_id);
  return new;
end;
$$;

create trigger follow_requests_notify
  after insert on public.follow_requests
  for each row execute function public.notify_on_follow_request();

create function public.handle_follow_request_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.follows (follower_id, following_id)
    values (new.requester_id, new.target_id)
    on conflict do nothing;

    insert into public.notifications (user_id, type, actor_id, entity_type, entity_id)
    values (new.requester_id, 'follow_accepted', new.target_id, 'profile', new.target_id);
  end if;

  new.responded_at = now();
  return new;
end;
$$;

create trigger follow_requests_respond
  before update on public.follow_requests
  for each row execute function public.handle_follow_request_response();

-- ---------------------------------------------------------------------------
-- Gate post + story visibility for private accounts to followers only
-- ---------------------------------------------------------------------------
drop policy "posts_select_published_or_own" on public.posts;

create policy "posts_select_visible" on public.posts
  for select using (
    auth.uid() = author_id
    or (
      status = 'published'
      and (
        not exists (select 1 from public.profiles p where p.id = author_id and p.is_private = true)
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = author_id
        )
      )
    )
  );

drop policy "stories_select_active_or_own" on public.stories;

create policy "stories_select_visible" on public.stories
  for select using (
    auth.uid() = author_id
    or (
      expires_at > now()
      and (
        not exists (select 1 from public.profiles p where p.id = author_id and p.is_private = true)
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = author_id
        )
      )
    )
  );

-- =============================================================================
-- 0009_gamification.sql
-- =============================================================================
-- Skilltego — Phase 7: gamification (XP, levels, badges, streaks).

alter table public.profiles add column streak_count integer not null default 0;
alter table public.profiles add column last_active_date date;

-- ---------------------------------------------------------------------------
-- badges
-- ---------------------------------------------------------------------------
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null
);

create table public.profile_badges (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (profile_id, badge_id)
);

alter table public.badges enable row level security;
alter table public.profile_badges enable row level security;

create policy "badges_select_all" on public.badges for select using (true);
create policy "profile_badges_select_all" on public.profile_badges for select using (true);

insert into public.badges (slug, name, description, icon) values
  ('first_post', 'First steps', 'Published your first post', 'sparkles'),
  ('ten_posts', 'Prolific creator', 'Published 10 posts', 'flame'),
  ('hundred_followers', 'Rising star', 'Reached 100 followers', 'star'),
  ('week_streak', 'Consistent', '7-day login streak', 'calendar-check'),
  ('level_5', 'Level 5', 'Reached level 5', 'trophy'),
  ('level_10', 'Level 10', 'Reached level 10', 'crown');

-- ---------------------------------------------------------------------------
-- XP / level engine
-- ---------------------------------------------------------------------------
create function public.award_xp(target_profile uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_xp integer;
begin
  update public.profiles
  set xp = xp + amount,
      coins = coins + greatest(amount / 5, 0)
  where id = target_profile
  returning xp into new_xp;

  update public.profiles
  set level = floor(new_xp / 100.0) + 1
  where id = target_profile;
end;
$$;

create function public.check_and_award_badges(target_profile uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  post_count integer;
  follower_count integer;
  profile_level integer;
  profile_streak integer;
begin
  select count(*) into post_count from public.posts where author_id = target_profile and status = 'published';
  select count(*) into follower_count from public.follows where following_id = target_profile;
  select level, streak_count into profile_level, profile_streak from public.profiles where id = target_profile;

  if post_count >= 1 then
    insert into public.profile_badges (profile_id, badge_id)
    select target_profile, id from public.badges where slug = 'first_post'
    on conflict do nothing;
  end if;

  if post_count >= 10 then
    insert into public.profile_badges (profile_id, badge_id)
    select target_profile, id from public.badges where slug = 'ten_posts'
    on conflict do nothing;
  end if;

  if follower_count >= 100 then
    insert into public.profile_badges (profile_id, badge_id)
    select target_profile, id from public.badges where slug = 'hundred_followers'
    on conflict do nothing;
  end if;

  if profile_streak >= 7 then
    insert into public.profile_badges (profile_id, badge_id)
    select target_profile, id from public.badges where slug = 'week_streak'
    on conflict do nothing;
  end if;

  if profile_level >= 5 then
    insert into public.profile_badges (profile_id, badge_id)
    select target_profile, id from public.badges where slug = 'level_5'
    on conflict do nothing;
  end if;

  if profile_level >= 10 then
    insert into public.profile_badges (profile_id, badge_id)
    select target_profile, id from public.badges where slug = 'level_10'
    on conflict do nothing;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Trigger wiring: award XP + check badges on the actions that earn them
-- ---------------------------------------------------------------------------
create function public.award_xp_on_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' then
    perform public.award_xp(new.author_id, 10);
    perform public.check_and_award_badges(new.author_id);
  end if;
  return new;
end;
$$;

create trigger posts_award_xp
  after insert on public.posts
  for each row execute function public.award_xp_on_post();

create function public.award_xp_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    perform public.award_xp(post_author, 2);
  end if;
  return new;
end;
$$;

create trigger post_likes_award_xp
  after insert on public.post_likes
  for each row execute function public.award_xp_on_like();

create function public.award_xp_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    perform public.award_xp(post_author, 5);
  end if;
  return new;
end;
$$;

create trigger post_comments_award_xp
  after insert on public.post_comments
  for each row execute function public.award_xp_on_comment();

create function public.award_xp_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_xp(new.follower_id, 1);
  perform public.check_and_award_badges(new.following_id);
  return new;
end;
$$;

create trigger follows_award_xp
  after insert on public.follows
  for each row execute function public.award_xp_on_follow();

-- =============================================================================
-- 0010_post_options.sql
-- =============================================================================
-- Skilltego — Phase 7: post options (hide like count, archive, pin).

alter table public.posts add column hide_like_count boolean not null default false;
alter table public.posts add column is_archived boolean not null default false;
alter table public.posts add column is_pinned boolean not null default false;
alter table public.posts add column pinned_at timestamptz;

create index posts_author_pinned_idx on public.posts (author_id, is_pinned desc, created_at desc);

-- =============================================================================
-- 0011_push_subscriptions.sql
-- =============================================================================
-- Skilltego — Phase 7: Web Push subscriptions.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- 0012_profile_change_limits.sql
-- =============================================================================
-- Skilltego — Phase 8: rate-limit how often a profile's name/username can change.
-- Append-only log: one row per successful change, read back as a rolling 30-day window.

create type profile_field as enum ('full_name', 'username');

create table public.profile_field_changes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  field profile_field not null,
  changed_at timestamptz not null default now()
);

create index profile_field_changes_profile_id_field_idx
  on public.profile_field_changes (profile_id, field, changed_at desc);

alter table public.profile_field_changes enable row level security;

-- No update/delete policy: change history is an append-only audit trail, so a
-- user can't clear their own record to bypass the rate limit.
create policy "profile_field_changes_select_own" on public.profile_field_changes
  for select using (auth.uid() = profile_id);

create policy "profile_field_changes_insert_own" on public.profile_field_changes
  for insert with check (auth.uid() = profile_id);

