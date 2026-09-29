-- Skilltego — fix the denormalized post counters (like/comment/save counts).
--
-- The counter triggers from 0002 ran as the *acting* user, so their
-- `update public.posts ...` was subject to the `posts_update_own` RLS policy.
-- When someone liked, commented on or saved another user's post, the
-- post_likes/post_comments/post_saves row was written but the counter update
-- silently matched zero rows. The result was posts showing 0 likes while the
-- viewer's like existed, and an unlike then showing -1 on screen.
--
-- Fix: make the counter functions security definer (same pattern as the
-- notification triggers in 0003), then resync every counter from the real rows.

create or replace function public.increment_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set like_count = like_count + 1 where id = new.post_id;
  return new;
end;
$$;

create or replace function public.decrement_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

create or replace function public.increment_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  return new;
end;
$$;

create or replace function public.decrement_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

create or replace function public.increment_post_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set save_count = save_count + 1 where id = new.post_id;
  return new;
end;
$$;

create or replace function public.decrement_post_save_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts set save_count = greatest(save_count - 1, 0) where id = old.post_id;
  return old;
end;
$$;

-- Resync the counters from the source-of-truth rows, touching only posts that
-- actually drifted.
with actual as (
  select
    p.id,
    (select count(*) from public.post_likes l where l.post_id = p.id)::int as likes,
    (select count(*) from public.post_comments c where c.post_id = p.id)::int as comments,
    (select count(*) from public.post_saves s where s.post_id = p.id)::int as saves
  from public.posts p
)
update public.posts p
set like_count = a.likes, comment_count = a.comments, save_count = a.saves
from actual a
where a.id = p.id
  and (p.like_count, p.comment_count, p.save_count) is distinct from (a.likes, a.comments, a.saves);
