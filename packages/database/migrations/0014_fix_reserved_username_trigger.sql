-- Skilltego — fix handle_new_user() so it never assigns a reserved username
-- (e.g. a signup email like "skilltego@..." previously produced the profile
-- username "skilltego", which the app's own RESERVED_USERNAMES list then
-- rejects on save, leaving onboarding stuck on a generic error).

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
          'moderator', 'notifications', 'onboarding', 'org', 'pricing', 'privacy', 'profile',
          'root', 'settings', 'signup', 'signin', 'skilltego', 'support', 'terms', 'verify'
        ])
  loop
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
