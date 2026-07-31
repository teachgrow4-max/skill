-- Skilltego — broadcast post deletions in real time.
--
-- The Supabase logs showed repeated 23503 foreign key violations on
-- post_likes_post_id_fkey: a user's feed/explore/reels/profile-grid still had
-- a post rendered after it was deleted elsewhere, so liking it inserted a row
-- referencing a post_id that no longer exists. Adding posts to the realtime
-- publication lets every open client drop a post from its lists the instant
-- it's deleted, closing the window instead of only handling the error after
-- the fact.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;
