-- Skilltego — let group conversations carry their own avatar.
--
-- Conversation rows had no image column, so the client had nothing to show
-- for a group but a participant's own photo (see chat-window.tsx / the
-- messages list, fixed alongside this migration). Set once at group creation
-- via the existing insert — no update policy needed.
alter table public.conversations add column avatar_url text;
