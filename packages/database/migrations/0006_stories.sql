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
