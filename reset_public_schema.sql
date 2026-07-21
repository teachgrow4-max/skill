-- Run this FIRST in Supabase SQL Editor to wipe out partial state from earlier
-- failed attempts, then run skilltego_full_schema.sql.
-- Note: this also cascades to drop the "on_auth_user_created" trigger on
-- auth.users (since it depends on a function in public) — that's expected,
-- the full schema script recreates it.

drop schema public cascade;
create schema public;
grant all on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
