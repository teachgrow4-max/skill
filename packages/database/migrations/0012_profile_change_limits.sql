-- Skilltego — Phase 8: rate-limit how often a profile's name/username can change.
-- Append-only log: one row per successful change, read back as a rolling 30-day window.

create type profile_field as enum ('full_name', 'username');

create table public.profile_field_changes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  field profile_field not null,
  changed_at timestamptz not null default now()
);

create index profile_field_changes_profile_id_field_idx
  on public.profile_field_changes (profile_id, field, changed_at desc);

alter table public.profile_field_changes enable row level security;

-- No update/delete policy: change history is an append-only audit trail, so a
-- user can't clear their own record to bypass the rate limit.
create policy "profile_field_changes_select_own" on public.profile_field_changes
  for select using (auth.uid() = profile_id);

create policy "profile_field_changes_insert_own" on public.profile_field_changes
  for insert with check (auth.uid() = profile_id);
