import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

import { BANK_QUESTIONS } from './bank.data';
import { BankQuestion, Difficulty } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Question bank runtime — offline-first, global (not per-user).
//
// Read order: AsyncStorage cache (remote updates) ?? bundled BANK_QUESTIONS
// (build-time, ships in the app so a fresh install works with no network). The
// bundle is always present synchronously, so questions are served immediately;
// the cache only ever *adds/overrides* by `code` once hydrated/refreshed.
//
// The `questions` Supabase table is shared read-only content, so this module is
// decoupled from the per-user progress outbox (state/sync.ts) — it can pull even
// when signed out.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_KEY = 'lm-bank:cache'; // JSON array of BankQuestion (remote rows)
const WATERMARK_KEY = 'lm-bank:pulledAt'; // ISO of the newest updated_at pulled

// Merged view by code (bundle first, remote overrides). Rebuilt on hydrate/refresh.
let merged = new Map<string, BankQuestion>();
let byLevel = new Map<string, BankQuestion[]>();

function rebuild(remote: BankQuestion[]): void {
  const next = new Map<string, BankQuestion>();
  for (const q of BANK_QUESTIONS) next.set(q.code, q);
  for (const q of remote) next.set(q.code, q); // remote wins
  merged = next;
  const grouped = new Map<string, BankQuestion[]>();
  for (const q of merged.values()) {
    const list = grouped.get(q.levelId) ?? [];
    list.push(q);
    grouped.set(q.levelId, list);
  }
  byLevel = grouped;
}

rebuild([]); // start from the bundle alone; cache layers in via hydrateBankCache()

async function readCache(): Promise<BankQuestion[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as BankQuestion[]) : [];
  } catch {
    return [];
  }
}

/** Layer the persisted remote cache over the bundle. Call once at app startup. */
export async function hydrateBankCache(): Promise<void> {
  rebuild(await readCache());
}

/** All bank questions for a level, optionally filtered to one difficulty tier. */
export function questionsForLevel(levelId: string, difficulty?: Difficulty): BankQuestion[] {
  const list = byLevel.get(levelId) ?? [];
  return difficulty ? list.filter((q) => q.difficulty === difficulty) : list;
}

// Supabase row → BankQuestion. The remote table also carries a `deleted`
// tombstone, handled by the caller.
type RemoteRow = {
  code: string;
  level_id: string;
  lab: BankQuestion['lab'];
  prompt: string;
  answer: number;
  difficulty: Difficulty;
  explanation: string;
  updated_at: string;
  deleted: boolean;
};

/**
 * Pull questions changed since the last watermark, merge into the cache, and
 * rebuild the in-memory view. Idempotent and offline-safe (no-op on failure).
 */
export async function refreshBankFromRemote(): Promise<void> {
  const watermark = (await AsyncStorage.getItem(WATERMARK_KEY)) ?? '1970-01-01T00:00:00Z';
  let rows: RemoteRow[];
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('code, level_id, lab, prompt, answer, difficulty, explanation, updated_at, deleted')
      .gt('updated_at', watermark);
    if (error || !data) return;
    rows = data as RemoteRow[];
  } catch {
    return; // offline — try again next foreground
  }
  if (rows.length === 0) return;

  const cache = new Map<string, BankQuestion>();
  for (const q of await readCache()) cache.set(q.code, q);
  let newest = watermark;
  for (const r of rows) {
    if (r.updated_at > newest) newest = r.updated_at;
    if (r.deleted) cache.delete(r.code);
    else
      cache.set(r.code, {
        code: r.code,
        levelId: r.level_id,
        lab: r.lab,
        prompt: r.prompt,
        answer: r.answer,
        difficulty: r.difficulty,
        explanation: r.explanation,
      });
  }
  const list = [...cache.values()];
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(list));
  await AsyncStorage.setItem(WATERMARK_KEY, newest);
  rebuild(list);
}
