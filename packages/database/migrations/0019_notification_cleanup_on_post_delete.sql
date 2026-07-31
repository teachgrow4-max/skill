-- Skilltego — clean up notifications when the post they refer to is deleted.
--
-- Notifications are polymorphic (entity_type/entity_id) so there's no FK from
-- notifications to posts to cascade automatically. A BEFORE DELETE trigger on
-- posts closes that gap: it runs in the same statement/transaction as the
-- post delete, before the posts -> post_comments cascade fires, so comments
-- (and therefore reply notifications) are still queryable. Any future
-- notification type that points at a post via entity_type = 'post' or at one
-- of its comments via entity_type = 'comment' is covered automatically —
-- nothing here is hardcoded to today's notification_type values.

create function public.cleanup_notifications_on_post_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where entity_type = 'comment'
    and entity_id in (select id from public.post_comments where post_id = old.id);

  delete from public.notifications
  where entity_type = 'post' and entity_id = old.id;

  return old;
end;
$$;

create trigger posts_cleanup_notifications
  before delete on public.posts
  for each row execute function public.cleanup_notifications_on_post_delete();

-- One-time backfill: purge notifications left orphaned by posts/comments that
-- were already deleted before this trigger existed, so the invariant holds
-- retroactively too.
delete from public.notifications
where entity_type = 'comment'
  and not exists (select 1 from public.post_comments c where c.id = notifications.entity_id);

delete from public.notifications
where entity_type = 'post'
  and not exists (select 1 from public.posts p where p.id = notifications.entity_id);

-- Let clients subscribe to live notification deletes (same mechanism already
-- used for realtime messages) so a deleted notification disappears from an
-- open notification panel without a page refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
