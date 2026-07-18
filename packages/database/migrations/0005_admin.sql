-- Skilltego — Phase 5 schema: admin RLS support.

create function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and account_type = 'admin'
  );
$$;

-- Admins can update any profile (verification, account type corrections, moderation actions).
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Admins can delete any post (content moderation escalation beyond author self-delete).
create policy "posts_delete_admin" on public.posts
  for delete using (public.is_admin(auth.uid()));

-- Admins can delete any comment.
create policy "post_comments_delete_admin" on public.post_comments
  for delete using (public.is_admin(auth.uid()));
