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
