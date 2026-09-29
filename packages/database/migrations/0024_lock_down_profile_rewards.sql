-- Skilltego — close the holes that let any signed-in user grant themselves
-- admin, verification, or Skill Coins.
--
-- 1. `profiles_update_own` lets a user update *every* column of their own row,
--    and the anon key + their own session are all it takes to call the REST
--    API directly. So anyone could set account_type = 'admin' (which is what
--    is_admin() checks), is_verified = true, or any skill_coins balance.
-- 2. award_skill_coins() and check_and_award_badges() are security definer
--    helpers meant only for the reward triggers, but Postgres grants EXECUTE
--    to PUBLIC by default — so anyone could rpc() coins/badges to any account.
-- 3. The daily check-in wrote skill_coins/streak straight from the user's
--    session (which is why #1 couldn't just be locked), and its 7-day-streak
--    badge insert was always silently rejected (profile_badges has no insert
--    policy). It moves into a security definer function below.

-- ---------------------------------------------------------------------------
-- 2. Internal reward helpers: triggers only
-- ---------------------------------------------------------------------------
revoke execute on function public.award_skill_coins(uuid, integer, text) from public, anon, authenticated;
revoke execute on function public.check_and_award_badges(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Daily check-in, server-side
-- ---------------------------------------------------------------------------
create or replace function public.record_daily_activity()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  prev_streak integer;
  prev_date date;
  new_streak integer;
  bonus integer;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select streak_count, last_active_date into prev_streak, prev_date
  from public.profiles
  where id = uid
  for update;

  if not found then
    return json_build_object('streak', 0, 'coins_awarded', 0);
  end if;

  -- Idempotent per calendar day (UTC, same as the old client-side logic).
  if prev_date = today then
    return json_build_object('streak', prev_streak, 'coins_awarded', 0);
  end if;

  new_streak := case when prev_date = today - 1 then prev_streak + 1 else 1 end;
  bonus := case new_streak when 7 then 30 when 30 then 150 else 0 end;

  update public.profiles
  set streak_count = new_streak, last_active_date = today
  where id = uid;

  perform public.award_skill_coins(uid, 2, 'Daily login');
  if bonus > 0 then
    perform public.award_skill_coins(uid, bonus, new_streak || '-day streak bonus');
  end if;
  perform public.check_and_award_badges(uid);

  return json_build_object('streak', new_streak, 'coins_awarded', 2 + bonus);
end;
$$;

revoke execute on function public.record_daily_activity() from public, anon;
grant execute on function public.record_daily_activity() to authenticated;

-- The ledger is now only ever written by award_skill_coins (security definer);
-- a user inserting their own rows could only fake their "earned" history.
drop policy if exists "skill_coin_events_insert_own" on public.skill_coin_events;

-- ---------------------------------------------------------------------------
-- 1. Protected profile columns
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Only direct writes from a client session are restricted. The reward
  -- triggers, daily check-in and signup all run as security definer (so
  -- current_user is the function owner here), and the service-role key runs
  -- as service_role.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  -- Admins manage roles and verification from the admin panel
  -- (profiles_update_admin policy).
  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.account_type is distinct from old.account_type
     and (new.account_type in ('admin', 'moderator') or old.account_type in ('admin', 'moderator')) then
    raise exception 'You can''t change this account type.' using errcode = '42501';
  end if;

  if new.is_verified is distinct from old.is_verified
     or new.skill_coins is distinct from old.skill_coins
     or new.level is distinct from old.level
     or new.streak_count is distinct from old.streak_count
     or new.last_active_date is distinct from old.last_active_date
     or new.referral_code is distinct from old.referral_code
     or new.referred_by is distinct from old.referred_by
     or new.total_referrals is distinct from old.total_referrals
     or new.has_claimed_welcome is distinct from old.has_claimed_welcome
     or new.has_posted_first_reel is distinct from old.has_posted_first_reel
     or new.has_received_first_like is distinct from old.has_received_first_like
     or new.has_reached_100_likes is distinct from old.has_reached_100_likes
     -- Flipping this back to false would re-arm claim_complete_profile_bonus.
     or (old.onboarding_completed and not new.onboarding_completed) then
    raise exception 'You can''t change protected profile fields.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_protected_columns on public.profiles;
create trigger profiles_guard_protected_columns
  before update on public.profiles
  for each row execute function public.guard_profile_protected_columns();
