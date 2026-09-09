-- Skilltego — let a profile owner remove someone who follows them.
--
-- follows_delete_own only allowed auth.uid() = follower_id (unfollowing
-- someone), so the follows.following_id side — the person being followed —
-- had no way to delete a row where they're followed by someone unwanted.
-- Postgres OR's multiple permissive policies for the same command, so this
-- is purely additive: unfollow keeps using the existing policy, "remove
-- follower" uses this one.
create policy "follows_delete_target" on public.follows
  for delete using (auth.uid() = following_id);
