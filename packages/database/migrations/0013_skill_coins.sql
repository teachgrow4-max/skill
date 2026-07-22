-- Skilltego — Phase 8: rename the XP system to Skill Coins.
-- `xp` becomes the single currency `skill_coins`; the old `coins` column
-- (an auto-derived side-currency that was never actually read anywhere in the
-- app) is dropped rather than kept alongside it, since it would just be a
-- second, redundant "coins" concept once XP itself is renamed to coins.

alter table public.profiles rename column xp to skill_coins;
alter table public.profiles drop column coins;

-- Renaming (rather than dropping/recreating) preserves the function's OID, so
-- every trigger that already calls it keeps working without being re-pointed.
alter function public.award_xp(uuid, integer) rename to award_skill_coins;

create or replace function public.award_skill_coins(target_profile uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  update public.profiles
  set skill_coins = skill_coins + amount
  where id = target_profile
  returning skill_coins into new_balance;

  update public.profiles
  set level = floor(new_balance / 100.0) + 1
  where id = target_profile;
end;
$$;

alter function public.award_xp_on_post() rename to award_skill_coins_on_post;

create or replace function public.award_skill_coins_on_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published' then
    perform public.award_skill_coins(new.author_id, 10);
    perform public.check_and_award_badges(new.author_id);
  end if;
  return new;
end;
$$;

alter trigger posts_award_xp on public.posts rename to posts_award_skill_coins;

alter function public.award_xp_on_like() rename to award_skill_coins_on_like;

create or replace function public.award_skill_coins_on_like()
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
    perform public.award_skill_coins(post_author, 2);
  end if;
  return new;
end;
$$;

alter trigger post_likes_award_xp on public.post_likes rename to post_likes_award_skill_coins;

alter function public.award_xp_on_comment() rename to award_skill_coins_on_comment;

create or replace function public.award_skill_coins_on_comment()
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
    perform public.award_skill_coins(post_author, 5);
  end if;
  return new;
end;
$$;

alter trigger post_comments_award_xp on public.post_comments rename to post_comments_award_skill_coins;

alter function public.award_xp_on_follow() rename to award_skill_coins_on_follow;

create or replace function public.award_skill_coins_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_skill_coins(new.follower_id, 1);
  perform public.check_and_award_badges(new.following_id);
  return new;
end;
$$;

alter trigger follows_award_xp on public.follows rename to follows_award_skill_coins;
