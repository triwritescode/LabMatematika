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

-- 5f. Owned stickers — one row per sticker so the merge is a union.  id = '<uid>:<stickerId>'
-- Stickers are bought in Toko with diamonds; ownership syncs additively.
create table if not exists public.owned_stickers (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  sticker_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- RLS + updated_at trigger + realtime, for every progress table.
do $$
declare
  t text;
begin
  foreach t in array array['level_mastery', 'lab_meta', 'tingkat_passed', 'active_days', 'user_stats', 'owned_stickers']
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
  foreach t in array array['level_mastery', 'lab_meta', 'tingkat_passed', 'active_days', 'user_stats', 'owned_stickers']
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

-- ============================================================================
-- 6. Friends (Add Friend feature).
--
-- Social/online feature — the first place a user reads *another* user's data.
-- Design principle: the own-rows RLS on `profiles`/`user_stats` stays untouched;
-- every cross-user read is funneled through a SECURITY DEFINER RPC that leaks
-- only whitelisted columns to a confirmed or pending friend. Friendship writes
-- go through RPCs too (no direct insert/update/delete grant on `friendships`),
-- so the request/accept consent rules are enforced server-side.
-- ============================================================================

-- 6a. Friend code on profiles — the shareable, privacy-safe identifier (no
-- searchable directory of children). 6 chars from an unambiguous alphabet
-- (no 0/O/1/I), e.g. 'K7QX9M'.
alter table public.profiles add column if not exists friend_code text unique;

create or replace function public.gen_friend_code()
returns text
language plpgsql
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    -- Collision is astronomically unlikely, but loop until the code is free.
    exit when not exists (select 1 from public.profiles where friend_code = code);
  end loop;
  return code;
end;
$$;

-- Assign a code to any existing profile that lacks one (one-time backfill).
update public.profiles set friend_code = public.gen_friend_code() where friend_code is null;

-- New users get a code at signup. Extends handle_new_user (§3) — kept as a
-- separate trigger so §3 stays copy-paste intact.
create or replace function public.assign_friend_code()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.friend_code is null then
    new.friend_code := public.gen_friend_code();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_assign_friend_code on public.profiles;
create trigger profiles_assign_friend_code
  before insert on public.profiles
  for each row execute function public.assign_friend_code();

-- 6b. Friendships — one direction-bearing row per relationship.
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint no_self_friend check (requester_id <> addressee_id),
  constraint uniq_pair unique (requester_id, addressee_id)
);

create index if not exists friendships_addressee_idx on public.friendships (addressee_id, status);
create index if not exists friendships_requester_idx on public.friendships (requester_id, status);

drop trigger if exists friendships_touch_updated_at on public.friendships;
create trigger friendships_touch_updated_at
  before update on public.friendships
  for each row execute function public.touch_updated_at();

-- RLS: a user may SELECT rows they're part of. All writes go through the RPCs
-- below (SECURITY DEFINER), so no insert/update/delete policy is granted.
alter table public.friendships enable row level security;

drop policy if exists "friendships_select_involved" on public.friendships;
create policy "friendships_select_involved"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- 6c. RPCs. SECURITY DEFINER so they can resolve another user's code / read a
-- friend's whitelisted columns without opening `profiles` RLS.

-- Send a request by the target's friend code. Rejects self, unknown code, and
-- any pre-existing relationship in either direction. Returns the new row.
create or replace function public.send_friend_request(code text)
returns public.friendships
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  target uuid;
  existing public.friendships;
  created public.friendships;
begin
  if me is null then
    raise exception 'not_authenticated';
  end if;

  select id into target from public.profiles
    where friend_code = upper(trim(code));
  if target is null then
    raise exception 'code_not_found';
  end if;
  if target = me then
    raise exception 'cannot_add_self';
  end if;

  select * into existing from public.friendships
    where (requester_id = me and addressee_id = target)
       or (requester_id = target and addressee_id = me)
    limit 1;
  if existing.id is not null then
    if existing.status = 'accepted' then
      raise exception 'already_friends';
    else
      raise exception 'request_exists';
    end if;
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
    values (me, target, 'pending')
    returning * into created;
  return created;
end;
$$;

-- Accept or reject an incoming request. Only the addressee of a pending row may
-- respond. Accept flips status; reject deletes the row.
create or replace function public.respond_friend_request(friendship_id uuid, accept boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  fr public.friendships;
begin
  select * into fr from public.friendships where id = friendship_id;
  if fr.id is null then
    raise exception 'not_found';
  end if;
  if fr.addressee_id <> me then
    raise exception 'not_addressee';
  end if;
  if fr.status <> 'pending' then
    raise exception 'not_pending';
  end if;

  if accept then
    update public.friendships set status = 'accepted' where id = friendship_id;
  else
    delete from public.friendships where id = friendship_id;
  end if;
end;
$$;

-- Remove a friend or cancel a pending request. Either party may call it.
create or replace function public.remove_friend(friendship_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  fr public.friendships;
begin
  select * into fr from public.friendships where id = friendship_id;
  if fr.id is null then
    return; -- idempotent: already gone
  end if;
  if fr.requester_id <> me and fr.addressee_id <> me then
    raise exception 'not_involved';
  end if;
  delete from public.friendships where id = friendship_id;
end;
$$;

-- Accepted friends with the minimal profile a friend may see + social stats.
-- The ONLY cross-user profile read path. Future leaderboard reuses this shape.
create or replace function public.list_friends()
returns table (
  friendship_id uuid,
  friend_id uuid,
  first_name text,
  last_name text,
  friend_code text,
  diamonds int,
  since timestamptz
)
language sql
security definer set search_path = public
as $$
  select
    f.id,
    p.id,
    p.first_name,
    p.last_name,
    p.friend_code,
    coalesce(s.diamonds, 0),
    f.updated_at
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  left join public.user_stats s on s.user_id = p.id
  where f.status = 'accepted'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  order by p.first_name;
$$;

-- Pending requests, both directions, with the other party's name. `direction`
-- is 'incoming' (I must respond) or 'outgoing' (awaiting their response).
create or replace function public.list_pending()
returns table (
  friendship_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  friend_code text,
  direction text,
  created_at timestamptz
)
language sql
security definer set search_path = public
as $$
  select
    f.id,
    p.id,
    p.first_name,
    p.last_name,
    p.friend_code,
    case when f.addressee_id = auth.uid() then 'incoming' else 'outgoing' end,
    f.created_at
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where f.status = 'pending'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  order by f.created_at desc;
$$;

-- Realtime on friendships so a second device sees a request / acceptance live.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships'
  ) then
    alter publication supabase_realtime add table public.friendships;
  end if;
end;
$$;
