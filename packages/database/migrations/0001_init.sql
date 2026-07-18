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
