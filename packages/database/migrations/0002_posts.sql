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

alter table public.posts add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(caption, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(skill_category, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'B')
  ) stored;

create index posts_search_vector_idx on public.posts using gin (search_vector);

create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles search vector (added here so Phase 2 search covers people too)
-- ---------------------------------------------------------------------------
alter table public.profiles add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(username, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(full_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(company, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(college, '')), 'B')
  ) stored;

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
