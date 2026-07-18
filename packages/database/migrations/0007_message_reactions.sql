-- Skilltego — Phase 6: message reactions (group chat + voice notes reuse
-- the existing conversations/messages schema from 0003).

create table public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),

  primary key (message_id, user_id),
  constraint emoji_length check (char_length(emoji) between 1 and 8)
);

create index message_reactions_message_id_idx on public.message_reactions (message_id);

alter table public.message_reactions enable row level security;

-- visible to conversation participants only
create policy "message_reactions_select_participant" on public.message_reactions
  for select using (
    exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

create policy "message_reactions_insert_own" on public.message_reactions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.messages m
      where m.id = message_id and public.is_conversation_participant(m.conversation_id, auth.uid())
    )
  );

create policy "message_reactions_delete_own" on public.message_reactions
  for delete using (auth.uid() = user_id);
