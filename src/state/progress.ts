import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { priceOf } from '@/constants/stickers';
import { ALL_LEVELS, tingkatsForLab } from '@/curriculum';
import { clampMastery, masteryDelta, rankFor } from '@/curriculum/mastery';
import { LabProgress, Operation } from '@/curriculum/types';
import type {
  ActiveDayRow,
  LabMetaRow,
  LevelMasteryRow,
  OwnedStickerRow,
  TiersPassedRow,
  UserStatsRow,
} from '@/lib/supabase';

// Local-first progress store (zustand + AsyncStorage) — the app is fully usable
// offline. The sync engine in sync.ts mirrors every mutation to Supabase through
// the mutation listener below, and merges remote rows back in via mergeRemote().

const LABS: Operation[] = ['add', 'sub', 'mul', 'div'];

function emptyLab(lab: Operation): LabProgress {
  return {
    lab,
    rank: rankFor(lab, []),
    placementDone: false,
    tingkatPassed: [],
    levels: {},
  };
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// UTC-safe day shift so all streak math uses the same calendar convention as
// todayISO() (which is UTC via toISOString).
export function shiftISO(iso: string, deltaDays: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + deltaDays * 86400000)
    .toISOString()
    .slice(0, 10);
}

// Duolingo-style: the streak is the run of consecutive practiced days ending
// today or yesterday. Missing a full day breaks it back to 0. Deriving from the
// day-history (instead of a stored counter) means the displayed streak is always
// correct on app open — and stays correct after a cross-device merge.
export function computeStreak(activeDates: string[], today = todayISO()): number {
  const set = new Set(activeDates);
  const yesterday = shiftISO(today, -1);
  if (!set.has(today) && !set.has(yesterday)) return 0;
  let cursor = set.has(today) ? today : yesterday;
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = shiftISO(cursor, -1);
  }
  return count;
}

// ── Sync bridge ───────────────────────────────────────────────────────────────
// Actions emit a compact mutation after every state change; the sync engine
// (sync.ts) turns these into Supabase upserts. Decoupled via a listener so this
// module never imports sync.ts (no import cycle) and works with no engine
// attached (e.g. before login).

export type ProgressMutation =
  | {
      kind: 'answer';
      lab: Operation;
      levelId: string;
      mastery: number;
      attempts: number;
      lastPracticedAt: string;
    }
  | { kind: 'tingkat'; lab: Operation; tingkat: number; rank: string; placementDone: boolean }
  | { kind: 'day'; day: string }
  | { kind: 'diamonds'; total: number }
  | { kind: 'sticker'; stickerId: string };

type MutationListener = (m: ProgressMutation) => void;
let mutationListener: MutationListener | null = null;

export function setMutationListener(listener: MutationListener | null) {
  mutationListener = listener;
}

function emit(m: ProgressMutation) {
  mutationListener?.(m);
}

// Rows pulled from Supabase by sync.ts, handed to mergeRemote().
export type RemoteProgress = {
  levels: LevelMasteryRow[];
  labMeta: LabMetaRow[];
  tingkat: TiersPassedRow[];
  days: ActiveDayRow[];
  stats: UserStatsRow | null;
  owned: OwnedStickerRow[];
};

type ProgressState = {
  childName: string;
  labs: Record<Operation, LabProgress>;
  streak: { count: number; lastActiveDate: string };
  // Every day (ISO yyyy-mm-dd, UTC) the user completed a practice/exam session.
  // Source of truth for both the streak count and the calendar widget.
  activeDates: string[];
  diamonds: number;
  // Sticker ids owned (bought in Toko). Additive/union across devices.
  ownedStickers: string[];
  setChildName: (name: string) => void;
  recordAnswer: (lab: Operation, levelId: string, correct: boolean, diff: number, streak: number) => void;
  passTingkat: (lab: Operation, tingkat: number) => void;
  touchStreak: () => void;
  addDiamonds: (amount: number) => void;
  // Spend diamonds to unlock a sticker. Returns false (no-op) if already owned
  // or the balance can't cover the price — the single source of truth for
  // affordability, so the UI can never overspend.
  buySticker: (stickerId: string) => boolean;
  mergeRemote: (remote: RemoteProgress) => void;
  resetProgress: () => void;
};

const initialData = () => ({
  childName: '',
  labs: {
    add: emptyLab('add'),
    sub: emptyLab('sub'),
    mul: emptyLab('mul'),
    div: emptyLab('div'),
  },
  streak: { count: 0, lastActiveDate: '' },
  activeDates: [] as string[],
  diamonds: 0,
  ownedStickers: [] as string[],
});

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      setChildName: (name) => set({ childName: name.trim() }),

      recordAnswer: (lab, levelId, correct, diff, streak) => {
        const labProgress = get().labs[lab];
        const prev = labProgress.levels[levelId];
        const prevMastery = prev?.mastery ?? 0;
        const entry = {
          levelId,
          // Already mastered (100%) → retakes for practice only, never lose progress.
          mastery: prevMastery >= 100 ? 100 : clampMastery(prevMastery + masteryDelta(correct, diff, streak)),
          attempts: (prev?.attempts ?? 0) + 1,
          lastPracticedAt: new Date().toISOString(),
        };
        set((state) => ({
          labs: {
            ...state.labs,
            [lab]: {
              ...state.labs[lab],
              levels: { ...state.labs[lab].levels, [levelId]: entry },
            },
          },
        }));
        emit({ kind: 'answer', lab, ...entry });
      },

      passTingkat: (lab, tingkat) => {
        const labProgress = get().labs[lab];
        if (labProgress.tingkatPassed.includes(tingkat)) return;
        const tingkatPassed = [...labProgress.tingkatPassed, tingkat].sort((a, b) => a - b);
        const rank = rankFor(lab, tingkatPassed);
        set((state) => ({
          labs: {
            ...state.labs,
            [lab]: { ...state.labs[lab], tingkatPassed, rank },
          },
        }));
        emit({ kind: 'tingkat', lab, tingkat, rank, placementDone: labProgress.placementDone });
      },

      touchStreak: () => {
        const today = todayISO();
        // Guard on activeDates (the source of truth), not lastActiveDate.
        if (get().activeDates.includes(today)) return;
        set((state) => {
          const activeDates = [...state.activeDates, today].sort();
          return {
            activeDates,
            streak: { count: computeStreak(activeDates, today), lastActiveDate: today },
          };
        });
        emit({ kind: 'day', day: today });
      },

      addDiamonds: (amount) => {
        const total = get().diamonds + amount;
        set({ diamonds: total });
        emit({ kind: 'diamonds', total });
      },

      buySticker: (stickerId) => {
        const { diamonds, ownedStickers } = get();
        if (ownedStickers.includes(stickerId)) return false;
        const price = priceOf(stickerId);
        if (price <= 0 || diamonds < price) return false;
        const total = diamonds - price;
        set({ diamonds: total, ownedStickers: [...ownedStickers, stickerId] });
        // Two mutations: the debited balance and the new ownership row.
        emit({ kind: 'diamonds', total });
        emit({ kind: 'sticker', stickerId });
        return true;
      },

      // Smart merge of server rows into local state. Additive data (tiers, days)
      // is a UNION; per-level mastery is last-write-wins by lastPracticedAt with
      // attempts kept at max; diamonds take the max. Nothing is ever lost by a
      // stale device syncing late.
      mergeRemote: (remote) =>
        set((state) => {
          const labs = { ...state.labs };
          for (const lab of LABS) labs[lab] = { ...labs[lab], levels: { ...labs[lab].levels } };

          for (const r of remote.levels) {
            if (r.deleted) continue;
            const lab = r.lab as Operation;
            if (!labs[lab]) continue;
            const local = labs[lab].levels[r.level_id];
            const remoteAt = r.last_practiced_at ?? '';
            const newer = !local || remoteAt > local.lastPracticedAt;
            labs[lab].levels[r.level_id] = {
              levelId: r.level_id,
              mastery: newer ? r.mastery : local.mastery,
              attempts: Math.max(local?.attempts ?? 0, r.attempts),
              lastPracticedAt: newer ? remoteAt : local.lastPracticedAt,
              dueForReview: (newer ? (r.due_for_review ?? undefined) : local?.dueForReview) ?? undefined,
            };
          }

          for (const r of remote.tingkat) {
            if (r.deleted) continue;
            const lab = r.lab as Operation;
            if (!labs[lab] || labs[lab].tingkatPassed.includes(r.tier)) continue;
            labs[lab].tingkatPassed = [...labs[lab].tingkatPassed, r.tier].sort((a, b) => a - b);
          }

          for (const r of remote.labMeta) {
            if (r.deleted) continue;
            const lab = r.lab as Operation;
            if (!labs[lab]) continue;
            labs[lab].placementDone = labs[lab].placementDone || r.placement_done;
          }

          // Rank always derives from the (unioned) tiers — keeps it consistent
          // even if a lab_meta row is stale.
          for (const lab of LABS) labs[lab].rank = rankFor(lab, labs[lab].tingkatPassed);

          const dates = new Set(state.activeDates);
          for (const r of remote.days) if (!r.deleted) dates.add(r.day);
          const activeDates = [...dates].sort();

          // Owned stickers union — additive, never lossy (like active days).
          const stickers = new Set(state.ownedStickers);
          for (const r of remote.owned) if (!r.deleted) stickers.add(r.sticker_id);

          return {
            labs,
            activeDates,
            streak: {
              count: computeStreak(activeDates),
              lastActiveDate: activeDates.at(-1) ?? '',
            },
            diamonds: Math.max(state.diamonds, remote.stats?.diamonds ?? 0),
            ownedStickers: [...stickers],
          };
        }),

      // Clean slate for account switches (called by sync.ts on sign-out).
      resetProgress: () => set(initialData()),
    }),
    {
      name: 'labmatematika-progress',
      storage: createJSONStorage(() => AsyncStorage),
      version: 3,
      // v0 → v1: seed the day-history from the last recorded active day so
      // existing users keep their current streak instead of resetting to 0.
      // v1 → v2: introduce the owned-stickers set (empty for existing users).
      // v2 → v3: curriculum re-keyed from the CSV bank — level ids and the
      // tingkat ladder changed. Prune orphaned mastery keys / passed tingkats
      // that no longer exist so stale entries don't linger in the store.
      migrate: (persisted: any, version) => {
        if (version < 1 && persisted && !persisted.activeDates) {
          const last: string | undefined = persisted?.streak?.lastActiveDate;
          persisted.activeDates = last ? [last] : [];
        }
        if (version < 2 && persisted && !persisted.ownedStickers) {
          persisted.ownedStickers = [];
        }
        if (version < 3 && persisted?.labs) {
          const validIds = new Set(ALL_LEVELS.map((l) => l.id));
          for (const lab of Object.keys(persisted.labs) as Operation[]) {
            const lp = persisted.labs[lab];
            if (!lp) continue;
            if (lp.levels) {
              for (const id of Object.keys(lp.levels)) {
                if (!validIds.has(id)) delete lp.levels[id];
              }
            }
            if (Array.isArray(lp.tingkatPassed)) {
              const validTingkats = new Set(tingkatsForLab(lab));
              lp.tingkatPassed = lp.tingkatPassed.filter((t: number) => validTingkats.has(t));
            }
          }
        }
        return persisted;
      },
    }
  )
);

// Live streak for display — derived from day-history so it self-heals on app
// open (e.g. reads 0 the day after a missed day, without needing a practice).
export function useCurrentStreak(): number {
  return useProgress((s) => computeStreak(s.activeDates));
}

export { LABS };
