-- LabMatematika — profiles schema + RLS.
-- Run this in the Supabase SQL Editor (see SETUP.md).

-- 1. Profile table: one row per auth user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  -- Nullable so the signup trigger can create the row before onboarding. The
  -- check below makes birth_date mandatory *once onboarding_complete flips true*.
  birth_date date,
  onboarding_complete boolean not null default false,
  constraint birth_date_required_when_onboarded
    check (not onboarding_complete or birth_date is not null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Row Level Security: a user can only see/edit their own row.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Auto-create an empty profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'given_name', ''),
    coalesce(new.raw_user_meta_data ->> 'family_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Keep updated_at fresh on every update.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 5. Progress sync (Legend-State syncedSupabase, offline-first).
--
-- Design: row-level last-write-wins keyed by a DETERMINISTIC text `id`, so the
-- same fact on two devices maps to the same row (converges, idempotent). Additive
-- data (tiers passed, practiced days) is modeled as SEPARATE rows so the merge is
-- a natural UNION and nothing is ever lost. Every table carries updated_at +
-- deleted for change-tracking, plus own-rows RLS. See src/state/progress$.ts.
-- ============================================================================

-- Helper: apply the shared own-rows RLS + updated_at trigger to a progress table.
-- (Written inline per table below — no dynamic SQL, to stay copy-paste friendly.)

-- 5a. Per-(user, level) mastery.  id = '<uid>:<levelId>'
create table if not exists public.level_mastery (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lab text not null,
  level_id text not null,
  mastery int not null default 0,
  attempts int not null default 0,
  last_practiced_at timestamptz,
  due_for_review timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- 5b. Per-(user, lab) meta: rank + placement.  id = '<uid>:<lab>'
create table if not exists public.lab_meta (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lab text not null,
  rank text not null default '',
  placement_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- 5c. Tiers passed — one row per tier so the merge is a union.  id = '<uid>:<lab>:<tingkat>'
create table if not exists public.tingkat_passed (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  lab text not null,
  tingkat int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- 5d. Practiced days — one row per day so the merge is a union.  id = '<uid>:<day>'
-- Streak is derived locally from this union (computeStreak), never stored.
create table if not exists public.active_days (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- 5e. Per-user scalar stats (diamonds).  id = '<uid>'
create table if not exists public.user_stats (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  diamonds int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- RLS + updated_at trigger + realtime, for every progress table.
do $$
declare
  t text;
begin
  foreach t in array array['level_mastery', 'lab_meta', 'tingkat_passed', 'active_days', 'user_stats']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_own_rows" on public.%I', t, t);
    execute format(
      'create policy "%s_own_rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t, t
    );
    execute format('create index if not exists %I on public.%I (user_id)', t || '_user_id_idx', t);
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
      t || '_touch_updated_at', t
    );
  end loop;
end;
$$;

-- Enable realtime so a second device receives changes live. Guarded so re-running
-- the whole file doesn't error if a table is already in the publication.
do $$
declare
  t text;
begin
  foreach t in array array['level_mastery', 'lab_meta', 'tingkat_passed', 'active_days', 'user_stats']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
