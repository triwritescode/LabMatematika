-- Curriculum re-keyed from the CSV bank + English naming pass:
--   • the unit of practice is a "skill" (was "level"): level_mastery → skill_mastery,
--     its column level_id → skill_id.
--   • the tier grouping is a "level" (was "tier"/"tingkat"): tiers_passed → levels_passed,
--     its column tier → level.
--   • new global, read-only `questions` bank (was app-generated). Also migrates a
--     `questions` table created from the FIRST schema draft (level_id / tingkat cols).
-- RENAME preserves existing rows, indexes, triggers, RLS policies, and realtime
-- publication membership — no data movement, no downtime.
--
-- Fully IDEMPOTENT: every step is guarded, so a partial or repeated run is safe.

do $$
begin
  -- 1. level_mastery → skill_mastery (+ column, dependent objects).
  if to_regclass('public.level_mastery') is not null then
    alter table public.level_mastery rename to skill_mastery;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'skill_mastery'
               and column_name = 'level_id') then
    alter table public.skill_mastery rename column level_id to skill_id;
  end if;
  alter index if exists public.level_mastery_user_id_idx rename to skill_mastery_user_id_idx;
  if exists (select 1 from pg_policies where schemaname = 'public'
             and tablename = 'skill_mastery' and policyname = 'level_mastery_own_rows') then
    alter policy "level_mastery_own_rows" on public.skill_mastery rename to "skill_mastery_own_rows";
  end if;
  if to_regclass('public.skill_mastery') is not null and exists (
       select 1 from pg_trigger
       where tgname = 'level_mastery_touch_updated_at'
         and tgrelid = 'public.skill_mastery'::regclass) then
    alter trigger level_mastery_touch_updated_at on public.skill_mastery
      rename to skill_mastery_touch_updated_at;
  end if;

  -- 2. tiers_passed → levels_passed (+ column, dependent objects).
  if to_regclass('public.tiers_passed') is not null then
    alter table public.tiers_passed rename to levels_passed;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'levels_passed'
               and column_name = 'tier') then
    alter table public.levels_passed rename column tier to level;
  end if;
  alter index if exists public.tiers_passed_user_id_idx rename to levels_passed_user_id_idx;
  if exists (select 1 from pg_policies where schemaname = 'public'
             and tablename = 'levels_passed' and policyname = 'tiers_passed_own_rows') then
    alter policy "tiers_passed_own_rows" on public.levels_passed rename to "levels_passed_own_rows";
  end if;
  if to_regclass('public.levels_passed') is not null and exists (
       select 1 from pg_trigger
       where tgname = 'tiers_passed_touch_updated_at'
         and tgrelid = 'public.levels_passed'::regclass) then
    alter trigger tiers_passed_touch_updated_at on public.levels_passed
      rename to levels_passed_touch_updated_at;
  end if;

  -- 3. Migrate a legacy `questions` table (first schema draft used level_id / tingkat).
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'questions'
               and column_name = 'level_id') then
    alter table public.questions rename column level_id to skill_id;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'questions'
               and column_name = 'tingkat') then
    alter table public.questions rename column tingkat to level;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'questions'
               and column_name = 'urutan') then
    alter table public.questions rename column urutan to ordinal;
  end if;
end $$;

-- 4. Global question bank (creates it if absent; §3 above fixed a legacy one).
create table if not exists public.questions (
  code text primary key,
  skill_id text not null,
  lab text not null,
  level int not null default 1,
  skill text not null,
  ordinal int not null default 1,
  prompt text not null,
  answer int not null,
  difficulty text not null check (difficulty in ('mudah', 'sedang', 'sulit')),
  explanation text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create index if not exists questions_skill_id_idx on public.questions (skill_id);
create index if not exists questions_updated_at_idx on public.questions (updated_at);

drop trigger if exists questions_touch_updated_at on public.questions;
create trigger questions_touch_updated_at
  before update on public.questions
  for each row execute function public.touch_updated_at();

alter table public.questions enable row level security;
drop policy if exists "questions_read_all" on public.questions;
create policy "questions_read_all"
  on public.questions for select
  using (true);
