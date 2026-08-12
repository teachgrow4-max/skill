-- Fix: creating a conversation (direct DM or group) always failed with
-- "new row violates row-level security policy for table conversations"
-- (or the same on conversation_participants for a group's other members).
--
-- Root cause: conversations_select_participant only let a user see a
-- conversation once they're a row in conversation_participants — but
-- getOrCreateDirectConversation/createGroupConversation insert the
-- conversation FIRST, then add participants (including the creator)
-- SECOND. That's a chicken-and-egg RLS gap:
--   - The conversations insert's `.select()` (INSERT ... RETURNING) is
--     itself subject to the SELECT policy, which the creator didn't
--     satisfy yet.
--   - The subsequent bulk insert into conversation_participants checks,
--     for every non-creator row, "exists (select 1 from conversations c
--     where c.id = conversation_id and c.created_by = auth.uid())" —
--     also gated by the same SELECT policy, so it couldn't see the
--     conversation it just created either.
--
-- Letting the creator see their own conversation regardless of
-- participant-row status closes that gap.
drop policy if exists "conversations_select_participant" on public.conversations;

create policy "conversations_select_participant" on public.conversations
  for select using (
    public.is_conversation_participant(id, auth.uid())
    or created_by = auth.uid()
  );
