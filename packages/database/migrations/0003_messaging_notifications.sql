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
