-- Skilltego — Phase 4 schema: opportunities (jobs/internships/competitions/
-- events/scholarships), candidate bookmarks, verification, mentor booking.

-- ---------------------------------------------------------------------------
-- profiles: resume for company/recruiter downloads
-- ---------------------------------------------------------------------------
alter table public.profiles add column resume_url text;

-- ---------------------------------------------------------------------------
-- opportunities (posted by company or college accounts)
-- ---------------------------------------------------------------------------
create type opportunity_kind as enum ('job', 'internship', 'competition', 'event', 'scholarship');
create type opportunity_status as enum ('draft', 'published', 'closed');

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind opportunity_kind not null,
  title text not null,
  description text not null,
  skill_category text,
  required_skills text[] not null default '{}'::text[],
  location text,
  is_remote boolean not null default false,
  compensation text,
  deadline timestamptz,
  event_date timestamptz,
  status opportunity_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint opportunity_title_length check (char_length(title) between 3 and 200),
  constraint opportunity_description_length check (char_length(description) <= 5000)
);

create index opportunities_author_id_idx on public.opportunities (author_id);
create index opportunities_kind_status_idx on public.opportunities (kind, status, created_at desc);
create index opportunities_required_skills_idx on public.opportunities using gin (required_skills);

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- opportunity_applications (job/internship applications and event/
-- competition registrations share the same shape)
-- ---------------------------------------------------------------------------
create type application_status as enum ('submitted', 'shortlisted', 'rejected', 'accepted');

create table public.opportunity_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  status application_status not null default 'submitted',
  cover_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint cover_note_length check (cover_note is null or char_length(cover_note) <= 2000),
  unique (opportunity_id, applicant_id)
);

create index opportunity_applications_opportunity_id_idx on public.opportunity_applications (opportunity_id);
create index opportunity_applications_applicant_id_idx on public.opportunity_applications (applicant_id);

create trigger opportunity_applications_set_updated_at
  before update on public.opportunity_applications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- candidate_bookmarks (companies/colleges bookmarking candidate profiles)
-- ---------------------------------------------------------------------------
create table public.candidate_bookmarks (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, candidate_id)
);

-- ---------------------------------------------------------------------------
-- verification_requests (company/college/mentor verification)
-- ---------------------------------------------------------------------------
create type verification_status as enum ('pending', 'approved', 'rejected');

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  organization_name text not null,
  proof_url text,
  notes text,
  status verification_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index verification_requests_status_idx on public.verification_requests (status, created_at);

-- ---------------------------------------------------------------------------
-- mentor availability, sessions, reviews
-- ---------------------------------------------------------------------------
create type session_status as enum ('requested', 'confirmed', 'completed', 'cancelled');

create table public.mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),

  constraint availability_time_order check (end_time > start_time)
);

create index mentor_availability_mentor_id_idx on public.mentor_availability (mentor_id, start_time);

create table public.mentor_sessions (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  availability_id uuid references public.mentor_availability (id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  status session_status not null default 'requested',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mentor_sessions_mentor_id_idx on public.mentor_sessions (mentor_id, scheduled_at);
create index mentor_sessions_student_id_idx on public.mentor_sessions (student_id, scheduled_at);

create trigger mentor_sessions_set_updated_at
  before update on public.mentor_sessions
  for each row execute function public.set_updated_at();

create table public.mentor_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentor_sessions (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now(),

  constraint rating_range check (rating between 1 and 5),
  unique (session_id)
);

create index mentor_reviews_mentor_id_idx on public.mentor_reviews (mentor_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.opportunities enable row level security;
alter table public.opportunity_applications enable row level security;
alter table public.candidate_bookmarks enable row level security;
alter table public.verification_requests enable row level security;
alter table public.mentor_availability enable row level security;
alter table public.mentor_sessions enable row level security;
alter table public.mentor_reviews enable row level security;

-- opportunities: published are public; drafts visible to author only
create policy "opportunities_select_published_or_own" on public.opportunities
  for select using (status = 'published' or auth.uid() = author_id);

create policy "opportunities_insert_own" on public.opportunities
  for insert with check (auth.uid() = author_id);

create policy "opportunities_update_own" on public.opportunities
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "opportunities_delete_own" on public.opportunities
  for delete using (auth.uid() = author_id);

-- opportunity_applications: applicant sees own; opportunity author sees applications to their postings
create policy "opportunity_applications_select_own_or_author" on public.opportunity_applications
  for select using (
    auth.uid() = applicant_id
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.author_id = auth.uid())
  );

create policy "opportunity_applications_insert_own" on public.opportunity_applications
  for insert with check (auth.uid() = applicant_id);

create policy "opportunity_applications_update_author_or_applicant" on public.opportunity_applications
  for update using (
    auth.uid() = applicant_id
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.author_id = auth.uid())
  ) with check (
    auth.uid() = applicant_id
    or exists (select 1 from public.opportunities o where o.id = opportunity_id and o.author_id = auth.uid())
  );

create policy "opportunity_applications_delete_own" on public.opportunity_applications
  for delete using (auth.uid() = applicant_id);

-- candidate_bookmarks: owner-only
create policy "candidate_bookmarks_select_own" on public.candidate_bookmarks
  for select using (auth.uid() = owner_id);

create policy "candidate_bookmarks_insert_own" on public.candidate_bookmarks
  for insert with check (auth.uid() = owner_id);

create policy "candidate_bookmarks_delete_own" on public.candidate_bookmarks
  for delete using (auth.uid() = owner_id);

-- verification_requests: requester sees own; moderators see and manage all
create policy "verification_requests_select_own_or_moderator" on public.verification_requests
  for select using (auth.uid() = profile_id or public.is_moderator(auth.uid()));

create policy "verification_requests_insert_own" on public.verification_requests
  for insert with check (auth.uid() = profile_id);

create policy "verification_requests_update_moderator" on public.verification_requests
  for update using (public.is_moderator(auth.uid())) with check (public.is_moderator(auth.uid()));

-- mentor_availability: publicly viewable (so students can book); only the mentor manages their own
create policy "mentor_availability_select_all" on public.mentor_availability
  for select using (true);

create policy "mentor_availability_insert_own" on public.mentor_availability
  for insert with check (auth.uid() = mentor_id);

create policy "mentor_availability_update_own" on public.mentor_availability
  for update using (auth.uid() = mentor_id) with check (auth.uid() = mentor_id);

create policy "mentor_availability_delete_own" on public.mentor_availability
  for delete using (auth.uid() = mentor_id);

-- mentor_sessions: visible to mentor and student involved
create policy "mentor_sessions_select_participant" on public.mentor_sessions
  for select using (auth.uid() = mentor_id or auth.uid() = student_id);

create policy "mentor_sessions_insert_student" on public.mentor_sessions
  for insert with check (auth.uid() = student_id);

create policy "mentor_sessions_update_participant" on public.mentor_sessions
  for update using (auth.uid() = mentor_id or auth.uid() = student_id)
  with check (auth.uid() = mentor_id or auth.uid() = student_id);

-- mentor_reviews: publicly viewable; only the student in a completed session may create their review
create policy "mentor_reviews_select_all" on public.mentor_reviews
  for select using (true);

create policy "mentor_reviews_insert_student" on public.mentor_reviews
  for insert with check (
    auth.uid() = student_id
    and exists (
      select 1 from public.mentor_sessions s
      where s.id = session_id and s.student_id = auth.uid() and s.status = 'completed'
    )
  );
