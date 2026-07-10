-- Rename tingkat_passed → tiers_passed and its column tingkat → tier, for English
-- naming consistency with the other progress tables (level_mastery, lab_meta, …).
-- RENAME preserves existing rows, indexes, triggers, RLS policies, and realtime
-- publication membership — no data movement, no downtime.

alter table public.tingkat_passed rename to tiers_passed;
alter table public.tiers_passed rename column tingkat to tier;

-- Tidy the dependent object names created by the friends_schema do-blocks to match.
alter index if exists public.tingkat_passed_user_id_idx rename to tiers_passed_user_id_idx;
alter policy "tingkat_passed_own_rows" on public.tiers_passed rename to "tiers_passed_own_rows";
alter trigger tingkat_passed_touch_updated_at on public.tiers_passed rename to tiers_passed_touch_updated_at;
