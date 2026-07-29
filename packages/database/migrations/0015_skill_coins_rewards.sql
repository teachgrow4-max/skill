-- Skilltego — Phase 9: Skill Coins rewards & referral program.
-- Adds a proper coin-history ledger, a referral system (per-profile code +
-- one-time referrer bonus), and several new one-time/milestone bonuses
-- (welcome, first reel, first like, 100-likes, streak milestones) that
-- layer on top of the existing per-action Skill Coins awards without
-- changing any of their amounts.

-- ---------------------------------------------------------------------------
-- profiles: new columns
-- ---------------------------------------------------------------------------
alter table public.profiles add column referral_code text;
alter table public.profiles add column referred_by uuid references public.profiles (id);
alter table public.profiles add column total_referrals integer not null default 0;
alter table public.profiles add column has_claimed_welcome boolean not null default false;
alter table public.profiles add column has_posted_first_reel boolean not null default false;
alter table public.profiles add column has_received_first_like boolean not null default false;
alter table public.profiles add column has_reached_100_likes boolean not null default false;

-- Backfill referral codes for any rows that predate this migration, before
-- the column is locked down to not-null + unique below. Codes are 5
-- characters drawn from an unambiguous alphanumeric charset (no 0/O or 1/I),
-- matching the format generated for new signups in handle_new_user() below.
do $$
declare
  rec record;
  candidate text;
  code_charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  for rec in select id from public.profiles where referral_code is null loop
    loop
      candidate := '';
      for i in 1..5 loop
        candidate := candidate || substr(code_charset, floor(random() * length(code_charset) + 1)::int, 1);
      end loop;
      exit when not exists (select 1 from public.profiles where referral_code = candidate);
    end loop;
    update public.profiles set referral_code = candidate where id = rec.id;
  end loop;
end $$;

alter table public.profiles alter column referral_code set not null;
alter table public.profiles add constraint profiles_referral_code_key unique (referral_code);
alter table public.profiles add constraint profiles_referral_code_format check (referral_code ~ '^[A-HJ-NP-Z2-9]{5}$');

-- ---------------------------------------------------------------------------
-- skill_coin_events: append-only ledger for every coin award
-- ---------------------------------------------------------------------------
create table public.skill_coin_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index skill_coin_events_profile_id_created_at_idx
  on public.skill_coin_events (profile_id, created_at desc);

alter table public.skill_coin_events enable row level security;

create policy "skill_coin_events_select_own" on public.skill_coin_events
  for select using (auth.uid() = profile_id);

-- Lets recordDailyActivity (which writes via the per-request client, not a
-- trigger) log its own history rows the same way triggers do.
create policy "skill_coin_events_insert_own" on public.skill_coin_events
  for insert with check (auth.uid() = profile_id);

-- ---------------------------------------------------------------------------
-- award_skill_coins: now takes a reason and logs every award to the ledger
-- ---------------------------------------------------------------------------
drop function if exists public.award_skill_coins(uuid, integer);

create function public.award_skill_coins(target_profile uuid, amount integer, reason text default 'Skill Coins earned')
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

  insert into public.skill_coin_events (profile_id, amount, reason)
  values (target_profile, amount, reason);
end;
$$;

-- ---------------------------------------------------------------------------
-- posts: base +10 (unchanged) + one-time first-reel +25 bonus
-- ---------------------------------------------------------------------------
create or replace function public.award_skill_coins_on_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  already_posted_reel boolean;
begin
  if new.status = 'published' then
    perform public.award_skill_coins(new.author_id, 10, 'Post published');
    perform public.check_and_award_badges(new.author_id);

    if new.type = 'video' then
      select has_posted_first_reel into already_posted_reel from public.profiles where id = new.author_id;
      if not already_posted_reel then
        perform public.award_skill_coins(new.author_id, 25, 'First reel posted');
        update public.profiles set has_posted_first_reel = true where id = new.author_id;
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- likes: base +2 to post author (unchanged) + first-like / 100-likes milestones
-- ---------------------------------------------------------------------------
create or replace function public.award_skill_coins_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  already_first_like boolean;
  already_100_likes boolean;
  total_likes_received integer;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.user_id then
    perform public.award_skill_coins(post_author, 2, 'Post liked');

    select has_received_first_like, has_reached_100_likes
      into already_first_like, already_100_likes
      from public.profiles where id = post_author;

    if not already_first_like then
      perform public.award_skill_coins(post_author, 5, 'First like received');
      update public.profiles set has_received_first_like = true where id = post_author;
    end if;

    if not already_100_likes then
      select count(*) into total_likes_received
        from public.post_likes pl
        join public.posts p on p.id = pl.post_id
        where p.author_id = post_author;

      if total_likes_received >= 100 then
        perform public.award_skill_coins(post_author, 50, '100 likes reached');
        update public.profiles set has_reached_100_likes = true where id = post_author;
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- comments / follows: unchanged amounts, now labeled in the ledger
-- ---------------------------------------------------------------------------
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
    perform public.award_skill_coins(post_author, 5, 'Post commented');
  end if;
  return new;
end;
$$;

create or replace function public.award_skill_coins_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_skill_coins(new.follower_id, 1, 'Followed someone');
  perform public.check_and_award_badges(new.following_id);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- signup: referral capture + welcome bonus. Supersedes 0014's reserved-
-- username fix (kept intact below) since this replaces the same function.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
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
  new_referral_code text;
  referral_code_charset text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  referral_code_char_idx int;
  referrer_id uuid;
  referral_code_input text;
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

  -- Reserved list mirrors RESERVED_USERNAMES in packages/utils/username.ts — keep in sync.
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username)
     or final_username = any (array[
          'admin', 'administrator', 'api', 'app', 'about', 'auth', 'blog', 'careers',
          'company', 'companies', 'contact', 'college', 'colleges', 'dashboard', 'explore',
          'faq', 'feed', 'help', 'home', 'login', 'logout', 'mentor', 'mentors', 'messages',
          'moderator', 'notifications', 'onboarding', 'org', 'pricing', 'privacy', 'profile', 'ref',
          'root', 'settings', 'signup', 'signin', 'skilltego', 'support', 'terms', 'verify'
        ])
  loop
    suffix := suffix + 1;
    final_username := left(base_username, 24) || '_' || suffix::text;
  end loop;

  -- Generate a unique 5-character referral code, e.g. "K7M2X". Charset
  -- excludes 0/O and 1/I to avoid ambiguity when a code is shared aloud.
  loop
    new_referral_code := '';
    for referral_code_char_idx in 1..5 loop
      new_referral_code := new_referral_code
        || substr(referral_code_charset, floor(random() * length(referral_code_charset) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = new_referral_code);
  end loop;

  -- Resolve an inbound referral code, if one was passed at signup. Self-referral
  -- is impossible here since new.id doesn't exist in profiles yet, so the only
  -- guard needed is that the code actually resolves to an existing referrer.
  referral_code_input := upper(trim(coalesce(new.raw_user_meta_data->>'referral_code', '')));
  if referral_code_input <> '' then
    select id into referrer_id from public.profiles where referral_code = referral_code_input;
  end if;

  insert into public.profiles (
    id, username, full_name, avatar_url, onboarding_completed,
    referral_code, referred_by, skill_coins, has_claimed_welcome
  )
  values (
    new.id,
    final_username,
    display_name,
    new.raw_user_meta_data->>'avatar_url',
    false,
    new_referral_code,
    referrer_id,
    5,
    true
  );

  insert into public.skill_coin_events (profile_id, amount, reason)
  values (new.id, 5, 'Welcome bonus');

  if referrer_id is not null then
    update public.profiles set total_referrals = total_referrals + 1 where id = referrer_id;
    perform public.award_skill_coins(referrer_id, 20, 'Referral bonus');
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Complete-profile bonus: safe to expose to authenticated clients since it
-- only ever affects the caller's own row (auth.uid()) and no-ops once
-- onboarding is already complete — can't be replayed to farm coins.
-- ---------------------------------------------------------------------------
create or replace function public.claim_complete_profile_bonus()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  already_onboarded boolean;
begin
  select onboarding_completed into already_onboarded from public.profiles where id = auth.uid();
  if already_onboarded is null or already_onboarded then
    return 0;
  end if;

  perform public.award_skill_coins(auth.uid(), 10, 'Complete profile bonus');
  return 10;
end;
$$;

grant execute on function public.claim_complete_profile_bonus() to authenticated;
