import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, type NativeEventSubscription } from 'react-native';

import { refreshBankFromRemote } from '@/curriculum/bank';
import { supabase } from '@/lib/supabase';
import {
  LABS,
  setMutationListener,
  useProgress,
  type ProgressMutation,
} from '@/state/progress';

// ─────────────────────────────────────────────────────────────────────────────
// Offline-first progress sync engine — zero native modules (stable, JS-only:
// zustand, AsyncStorage, supabase-js, RN AppState). Nothing to link, no rebuild.
//
// Writes: every store mutation lands in a persisted OUTBOX (AsyncStorage) and is
// upserted to Supabase when a flush succeeds. Offline, the outbox simply grows;
// it survives restarts and flushes after each mutation (debounced), on app
// foreground, and — when a flush fails offline — via an automatic backoff retry
// loop that keeps trying until the network returns (no connectivity listener
// needed).
//
// Reads: on login and on foreground the engine pulls the user's rows and merges
// them into the local store (mergeRemote — union/max/LWW, never lossy).
//
// Convergence: rows use DETERMINISTIC ids (same fact → same row on any device),
// so repeated upserts are idempotent and cross-device merge is row-skill
// last-write-wins, with additive data (tiers, days) modeled as union rows.
// Tables + RLS: supabase/schema.sql §5.
// ─────────────────────────────────────────────────────────────────────────────

type TableName =
  | 'skill_mastery'
  | 'lab_meta'
  | 'levels_passed'
  | 'active_days'
  | 'user_stats'
  | 'owned_stickers';

type OutboxItem = { table: TableName; row: { id: string } & Record<string, unknown> };

const DEBOUNCE_MS = 800; // batch a practice session's rapid answers into one flush
const RETRY_MIN_MS = 2000;
const RETRY_MAX_MS = 30000; // cap: worst-case reconnect flush latency while idle
const PULL_MIN_INTERVAL_MS = 60000; // throttle foreground re-pulls

const outboxKey = (u: string) => `lm-sync:outbox:${u}`;
const pulledKey = (u: string) => `lm-sync:pulled:${u}`;
const LAST_UID_KEY = 'lm-sync:lastUid';

let uid: string | null = null;
let outbox: Record<string, OutboxItem> = {};
let appSub: NativeEventSubscription | null = null;
let flushing = false;
let pulled = false; // first successful pull done (gates the one-time full push)
let lastPullAt = 0;
let retryDelay = RETRY_MIN_MS;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function persistOutbox() {
  if (uid) void AsyncStorage.setItem(outboxKey(uid), JSON.stringify(outbox));
}

// ── Row builders ──────────────────────────────────────────────────────────────
// Deterministic ids: `${uid}:${fact}` — the same fact converges to one row.
function mutationToItems(u: string, m: ProgressMutation): OutboxItem[] {
  switch (m.kind) {
    case 'answer':
      return [
        {
          table: 'skill_mastery',
          row: {
            id: `${u}:${m.skillId}`,
            user_id: u,
            lab: m.lab,
            skill_id: m.skillId,
            mastery: m.mastery,
            attempts: m.attempts,
            last_practiced_at: m.lastPracticedAt || null,
          },
        },
      ];
    case 'level':
      return [
        {
          table: 'levels_passed',
          row: { id: `${u}:${m.lab}:${m.level}`, user_id: u, lab: m.lab, level: m.level },
        },
        {
          table: 'lab_meta',
          row: { id: `${u}:${m.lab}`, user_id: u, lab: m.lab, rank: m.rank, placement_done: m.placementDone },
        },
      ];
    case 'day':
      return [{ table: 'active_days', row: { id: `${u}:${m.day}`, user_id: u, day: m.day } }];
    case 'diamonds':
      return [{ table: 'user_stats', row: { id: u, user_id: u, diamonds: m.total } }];
    case 'sticker':
      return [
        {
          table: 'owned_stickers',
          row: { id: `${u}:${m.stickerId}`, user_id: u, sticker_id: m.stickerId },
        },
      ];
  }
}

function enqueue(items: OutboxItem[]) {
  for (const item of items) outbox[`${item.table}:${item.row.id}`] = item;
  persistOutbox();
}

// Everything currently in the local store, as outbox items. Used once after the
// first successful pull, so progress made before sync existed (or offline before
// first login) reaches the server.
function fullPushItems(u: string): OutboxItem[] {
  const s = useProgress.getState();
  const items: OutboxItem[] = [];
  for (const lab of LABS) {
    const lp = s.labs[lab];
    if (lp.levelsPassed.length || lp.placementDone) {
      for (const t of lp.levelsPassed) {
        items.push(
          ...mutationToItems(u, {
            kind: 'level',
            lab,
            level: t,
            rank: lp.rank,
            placementDone: lp.placementDone,
          })
        );
      }
    }
    for (const lm of Object.values(lp.skills)) {
      items.push(
        ...mutationToItems(u, {
          kind: 'answer',
          lab,
          skillId: lm.skillId,
          mastery: lm.mastery,
          attempts: lm.attempts,
          lastPracticedAt: lm.lastPracticedAt,
        })
      );
    }
  }
  for (const day of s.activeDates) items.push(...mutationToItems(u, { kind: 'day', day }));
  if (s.diamonds > 0) items.push(...mutationToItems(u, { kind: 'diamonds', total: s.diamonds }));
  for (const stickerId of s.ownedStickers) items.push(...mutationToItems(u, { kind: 'sticker', stickerId }));
  return items;
}

// ── Transport ─────────────────────────────────────────────────────────────────
async function pullAndMerge(u: string): Promise<boolean> {
  try {
    const [skills, labMeta, levels, days, stats, owned] = await Promise.all([
      supabase.from('skill_mastery').select('*').eq('user_id', u),
      supabase.from('lab_meta').select('*').eq('user_id', u),
      supabase.from('levels_passed').select('*').eq('user_id', u),
      supabase.from('active_days').select('*').eq('user_id', u),
      supabase.from('user_stats').select('*').eq('user_id', u).maybeSingle(),
      supabase.from('owned_stickers').select('*').eq('user_id', u),
    ]);
    if (skills.error || labMeta.error || levels.error || days.error || stats.error || owned.error)
      return false;
    useProgress.getState().mergeRemote({
      skills: skills.data ?? [],
      labMeta: labMeta.data ?? [],
      levels: levels.data ?? [],
      days: days.data ?? [],
      stats: stats.data ?? null,
      owned: owned.data ?? [],
    });
    return true;
  } catch {
    return false; // offline — merge next time
  }
}

async function flush(): Promise<void> {
  if (flushing || !uid) return;
  const entries = Object.entries(outbox);
  if (entries.length === 0) return;
  flushing = true;
  try {
    const byTable = new Map<TableName, [string, OutboxItem][]>();
    for (const [key, item] of entries) {
      const group = byTable.get(item.table) ?? [];
      group.push([key, item]);
      byTable.set(item.table, group);
    }
    for (const [table, group] of byTable) {
      const { error } = await supabase.from(table).upsert(group.map(([, i]) => i.row) as never);
      if (error) throw error;
      // Only drop items that weren't replaced by a newer write mid-flight.
      for (const [key, item] of group) if (outbox[key] === item) delete outbox[key];
      persistOutbox();
    }
    retryDelay = RETRY_MIN_MS;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  } catch {
    scheduleRetry(); // offline or server error — exponential backoff
  } finally {
    flushing = false;
  }
}

function scheduleRetry() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void flush();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
}

// Pull (throttled) then push. The one-time full push only happens after the
// first successful pull, so a fresh install can't blind-overwrite newer server
// rows with its empty/stale local state.
async function syncNow(): Promise<void> {
  if (!uid) return;
  const u = uid;
  const now = Date.now();
  if (!pulled || now - lastPullAt > PULL_MIN_INTERVAL_MS) {
    // Refresh the shared question bank alongside the per-user pull (offline-safe,
    // no-op when unchanged). Decoupled from the outbox — global content.
    void refreshBankFromRemote();
    const ok = await pullAndMerge(u);
    if (ok) {
      lastPullAt = now;
      if (!pulled) {
        pulled = true;
        void AsyncStorage.setItem(pulledKey(u), '1');
        enqueue(fullPushItems(u));
      }
    }
  }
  await flush();
}

function scheduleDebouncedSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncNow();
  }, DEBOUNCE_MS);
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
/** Start syncing this user's progress. Idempotent per uid; call once signed in. */
export async function startProgressSync(userId: string): Promise<void> {
  if (uid === userId) return;
  if (uid) await stopProgressSync(); // account switch without an explicit sign-out

  // If a different account used this device last, drop its leftover local
  // progress so accounts never bleed into each other.
  const lastUid = await AsyncStorage.getItem(LAST_UID_KEY);
  if (lastUid && lastUid !== userId) useProgress.getState().resetProgress();
  void AsyncStorage.setItem(LAST_UID_KEY, userId);

  uid = userId;
  try {
    outbox = JSON.parse((await AsyncStorage.getItem(outboxKey(userId))) ?? '{}');
  } catch {
    outbox = {};
  }
  pulled = (await AsyncStorage.getItem(pulledKey(userId))) === '1';

  setMutationListener((m) => {
    if (!uid) return;
    enqueue(mutationToItems(uid, m));
    scheduleDebouncedSync();
  });

  // Foreground is the cheap, native-free reconnect signal: coming back to the
  // app is when a fresh pull + queued push matters most. Between foregrounds,
  // the backoff retry loop recovers a dropped connection on its own.
  appSub = AppState.addEventListener('change', (state) => {
    if (state === 'active') void syncNow();
  });

  void syncNow();
}

/**
 * Stop syncing + clear this user's local progress. Call BEFORE Supabase
 * signOut so the final best-effort flush still has a valid session.
 */
export async function stopProgressSync(): Promise<void> {
  if (!uid) return;
  setMutationListener(null);
  appSub?.remove();
  appSub = null;
  if (retryTimer) clearTimeout(retryTimer);
  if (debounceTimer) clearTimeout(debounceTimer);
  retryTimer = debounceTimer = null;

  await flush(); // best-effort: don't lose a just-finished offline session

  const u = uid;
  uid = null;
  outbox = {};
  pulled = false;
  retryDelay = RETRY_MIN_MS;
  lastPullAt = 0;
  void AsyncStorage.removeItem(outboxKey(u));
  void AsyncStorage.removeItem(pulledKey(u));
  useProgress.getState().resetProgress();
}

// ── Cached profile snapshot ───────────────────────────────────────────────────
// Lets auth resolve a returning, already-onboarded user to `ready` while
// offline (the profiles fetch needs the network).
export type ProfileSnapshot = {
  firstName: string;
  lastName: string;
  // ISO YYYY-MM-DD birth date; age is derived on demand (see lib/age).
  birthDate: string;
  onboarded: boolean;
};

export function saveProfileSnapshot(userId: string, snap: ProfileSnapshot): Promise<void> {
  return AsyncStorage.setItem(`lm-sync:profile:${userId}`, JSON.stringify(snap));
}

export async function loadProfileSnapshot(userId: string): Promise<ProfileSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(`lm-sync:profile:${userId}`);
    return raw ? (JSON.parse(raw) as ProfileSnapshot) : null;
  } catch {
    return null;
  }
}
