-- Skilltego — speed up ilike-based search that the tsvector indexes don't cover.
--
-- searchProfilesBySkill (used by Explore search AND talent search) matches
-- profile_skills.skill_name with a leading-wildcard ilike ('%term%'), which a
-- plain btree index can't accelerate — every keystroke does a full table
-- scan. Same problem for admin's searchUsers on profiles.username/full_name.
-- pg_trgm's GIN trigram index speeds up exactly this ilike pattern with zero
-- application code changes — the existing queries stay as-is.
create extension if not exists pg_trgm;

create index if not exists profile_skills_skill_name_trgm_idx
  on public.profile_skills using gin (skill_name gin_trgm_ops);

create index if not exists profiles_username_trgm_idx
  on public.profiles using gin (username gin_trgm_ops);

create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin (full_name gin_trgm_ops);
