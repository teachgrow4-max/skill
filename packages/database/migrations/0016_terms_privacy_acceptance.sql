-- Skilltego — record Terms of Service / Privacy Policy acceptance at signup.

alter table public.profiles add column terms_accepted boolean not null default false;
alter table public.profiles add column terms_accepted_at timestamptz;
alter table public.profiles add column privacy_accepted_at timestamptz;

-- Recreated in full (rather than patched) since handle_new_user must always be
-- replaced as a complete function body. Only addition vs. 0015: reads
-- raw_user_meta_data->>'agreed_to_terms' (set by the email/password signup form)
-- and records it. OAuth signups never set this key, so it safely defaults to
-- false/null for them rather than failing — this migration only adds an audit
-- record, it does not block account creation for any signup method.
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
  code_candidate text;
  referrer_id uuid;
  referral_code_input text;
  terms_agreed boolean;
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

  -- Generate a unique referral code, e.g. "NITHIN482".
  code_candidate := upper(left(regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g'), 8));
  if length(code_candidate) < 3 then
    code_candidate := 'USER' || code_candidate;
  end if;
  loop
    new_referral_code := code_candidate || floor(random() * 900 + 100)::int::text;
    exit when not exists (select 1 from public.profiles where referral_code = new_referral_code);
  end loop;

  -- Resolve an inbound referral code, if one was passed at signup. Self-referral
  -- is impossible here since new.id doesn't exist in profiles yet, so the only
  -- guard needed is that the code actually resolves to an existing referrer.
  referral_code_input := upper(trim(coalesce(new.raw_user_meta_data->>'referral_code', '')));
  if referral_code_input <> '' then
    select id into referrer_id from public.profiles where referral_code = referral_code_input;
  end if;

  terms_agreed := coalesce((new.raw_user_meta_data->>'agreed_to_terms')::boolean, false);

  insert into public.profiles (
    id, username, full_name, avatar_url, onboarding_completed,
    referral_code, referred_by, skill_coins, has_claimed_welcome,
    terms_accepted, terms_accepted_at, privacy_accepted_at
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
    true,
    terms_agreed,
    case when terms_agreed then now() else null end,
    case when terms_agreed then now() else null end
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
