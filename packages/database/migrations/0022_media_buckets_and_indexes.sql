-- Skilltego — media architecture overhaul, part 1: dedicated Storage buckets
-- per content type (instead of dumping everything into `post-media`) and feed
-- indexes that match the app's actual reels/feed query patterns.
--
-- The old `post-media` bucket and everything already stored in it are left
-- exactly as-is — public URLs are absolute and stored per-row, so old and new
-- content resolve fine side by side with no migration/downtime needed. It
-- keeps being used for resumes and DM voice notes, which aren't part of this
-- overhaul.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('posts', 'posts', true, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  ('reels', 'reels', true, 52428800, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('stories', 'stories', true, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do nothing;

-- Same ownership pattern as post-media: `${auth.uid()}/<uuid>.<ext>`, public
-- read, owner-scoped write, checked via a folder-prefix match.
create policy "media_buckets_public_read" on storage.objects
  for select using (bucket_id = any(array['avatars', 'posts', 'reels', 'stories']));

create policy "media_buckets_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = any(array['avatars', 'posts', 'reels', 'stories'])
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_buckets_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = any(array['avatars', 'posts', 'reels', 'stories'])
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "media_buckets_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = any(array['avatars', 'posts', 'reels', 'stories'])
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- getReelsPosts filters status='published' and type='video' and is_archived=false,
-- ordered by created_at desc — none of that was indexed before, so it fell back to
-- posts_status_created_idx and filtered out non-video/archived rows row-by-row.
create index posts_reels_feed_idx on public.posts (created_at desc)
  where status = 'published' and type = 'video' and is_archived = false;

-- getLatestPosts/getFollowingPosts share the same status+is_archived filter (the
-- latter adds an author_id IN (...) on top) — this partial index prunes to the
-- much smaller "actually feed-visible" set before that additional filtering.
create index posts_published_feed_idx on public.posts (created_at desc)
  where status = 'published' and is_archived = false;
