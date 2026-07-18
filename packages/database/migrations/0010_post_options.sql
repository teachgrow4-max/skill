-- Skilltego — Phase 7: post options (hide like count, archive, pin).

alter table public.posts add column hide_like_count boolean not null default false;
alter table public.posts add column is_archived boolean not null default false;
alter table public.posts add column is_pinned boolean not null default false;
alter table public.posts add column pinned_at timestamptz;

create index posts_author_pinned_idx on public.posts (author_id, is_pinned desc, created_at desc);
