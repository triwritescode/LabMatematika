-- ============================================================================
-- 7. Runtunan Teman (shared Friend Streak, Duolingo-style).
--
-- No new tables: a friend streak is DERIVED, exactly like the solo streak
-- (progress.ts computeStreak derives from active_days, never stores a counter).
-- The shared streak is the intersection of two friends' active_days — the run
-- of consecutive days BOTH practiced, ending today or yesterday (UTC, matching
-- the solo-streak grace rule).
--
-- Computed on demand in a SECURITY DEFINER RPC so a user may read only the
-- intersection with an *accepted* friend (own-rows RLS on active_days stays
-- intact — the RPC never exposes a friend's non-shared days).
-- ============================================================================

create or replace function public.friend_streaks()
returns table (
  friend_id uuid,
  streak int,
  shared_today boolean
)
language plpgsql
security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
begin
  return query
  with my_friends as (
    select case when f.requester_id = me then f.addressee_id else f.requester_id end as fid
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester_id = me or f.addressee_id = me)
  ),
  -- Days both parties were active (intersection).
  shared as (
    select fr.fid, a.day
    from my_friends fr
    join public.active_days a on a.user_id = me and not a.deleted
    join public.active_days b
      on b.user_id = fr.fid and b.day = a.day and not b.deleted
  ),
  -- Gaps-and-islands: consecutive days share (day - row_number) as a group key.
  islands as (
    select fid, day,
           day - (row_number() over (partition by fid order by day))::int as grp
    from shared
  ),
  runs as (
    select fid, count(*)::int as len, max(day) as last_day
    from islands
    group by fid, grp
  )
  select
    fr.fid,
    -- The run ending today or yesterday, else 0.
    coalesce((
      select r.len from runs r
      where r.fid = fr.fid and r.last_day in (today, today - 1)
      order by r.last_day desc
      limit 1
    ), 0) as streak,
    exists (select 1 from shared s where s.fid = fr.fid and s.day = today) as shared_today
  from my_friends fr;
end;
$$;
