-- Skilltego — Phase 7: private accounts + follow requests.

alter type notification_type add value if not exists 'follow_request';
alter type notification_type add value if not exists 'follow_accepted';

alter table public.profiles add column is_private boolean not null default false;

create type follow_request_status as enum ('pending', 'accepted', 'declined');

create table public.follow_requests (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  target_id uuid not null references public.profiles (id) on delete cascade,
  status follow_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,

  primary key (requester_id, target_id),
  constraint no_self_request check (requester_id <> target_id)
);

create index follow_requests_target_pending_idx on public.follow_requests (target_id) where status = 'pending';

alter table public.follow_requests enable row level security;

create policy "follow_requests_select_own" on public.follow_requests
  for select using (auth.uid() = requester_id or auth.uid() = target_id);

create policy "follow_requests_insert_own" on public.follow_requests
  for insert with check (auth.uid() = requester_id);

create policy "follow_requests_update_target" on public.follow_requests
  for update using (auth.uid() = target_id) with check (auth.uid() = target_id);

create policy "follow_requests_delete_own" on public.follow_requests
  for delete using (auth.uid() = requester_id or auth.uid() = target_id);

-- ---------------------------------------------------------------------------
-- Notify + auto-follow on request / acceptance
-- ---------------------------------------------------------------------------
create function public.notify_on_follow_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, actor_id, entity_type, entity_id)
  values (new.target_id, 'follow_request', new.requester_id, 'profile', new.requester_id);
  return new;
end;
$$;

create trigger follow_requests_notify
  after insert on public.follow_requests
  for each row execute function public.notify_on_follow_request();

create function public.handle_follow_request_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' then
    insert into public.follows (follower_id, following_id)
    values (new.requester_id, new.target_id)
    on conflict do nothing;

    insert into public.notifications (user_id, type, actor_id, entity_type, entity_id)
    values (new.requester_id, 'follow_accepted', new.target_id, 'profile', new.target_id);
  end if;

  new.responded_at = now();
  return new;
end;
$$;

create trigger follow_requests_respond
  before update on public.follow_requests
  for each row execute function public.handle_follow_request_response();

-- ---------------------------------------------------------------------------
-- Gate post + story visibility for private accounts to followers only
-- ---------------------------------------------------------------------------
drop policy "posts_select_published_or_own" on public.posts;

create policy "posts_select_visible" on public.posts
  for select using (
    auth.uid() = author_id
    or (
      status = 'published'
      and (
        not exists (select 1 from public.profiles p where p.id = author_id and p.is_private = true)
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = author_id
        )
      )
    )
  );

drop policy "stories_select_active_or_own" on public.stories;

create policy "stories_select_visible" on public.stories
  for select using (
    auth.uid() = author_id
    or (
      expires_at > now()
      and (
        not exists (select 1 from public.profiles p where p.id = author_id and p.is_private = true)
        or exists (
          select 1 from public.follows f
          where f.follower_id = auth.uid() and f.following_id = author_id
        )
      )
    )
  );
