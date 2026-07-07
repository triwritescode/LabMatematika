# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md — **read this first.** Expo SDK 57 has changed significantly from training-data
knowledge; consult https://docs.expo.dev/versions/v57.0.0/ before writing Expo/React Native
code, especially for router, config plugins, or native module APIs.

## Commands

Package manager is **pnpm** (pnpm-lock.yaml / pnpm-workspace.yaml present — don't use npm/yarn).

```bash
pnpm install
pnpm start            # expo start
pnpm android          # expo run:android (dev build required — see below)
pnpm ios              # expo run:ios
pnpm web              # expo start --web
pnpm lint             # expo lint (eslint-config-expo flat config)
```

No test suite exists in this repo currently.

Native Google Sign-In requires a **development build**, not Expo Go:
```bash
npx expo prebuild --clean   # regenerate android/ (already committed, only needed after native config changes)
npx expo run:android
```
See `docs/SETUP.md` for full Supabase + Google OAuth credential wiring, and `docs/BUILD.md` for
building a manually-installable release APK without EAS.

## Product concept

LabMatematika — offline-first Bahasa Indonesia math practice app. Full pedagogical spec is
`docs/specs.md` (deliberate-practice model, mastery gating, exam rules, full curriculum ladder
per lab, UX principles). Read it before touching curriculum/mastery/exam logic — it's the
source of truth for *why* the rules are shaped the way they are, not just what they do.

**All user-facing UI copy is Bahasa Indonesia**, centralized in `src/i18n/strings.id.ts`. The
spec doc itself is English; the app is not.

## Deliberate deviations from docs/specs.md

The spec (written earlier) assumes Legend-State + MMKV + NativeWind. The actual implementation
intentionally uses different, already-agreed choices — **do not "fix" these back toward the
spec**:

- **zustand + AsyncStorage**, not Legend-State + MMKV — runs in Expo Go without a dev build.
  `src/state/progress.ts`'s storage adapter is the single swap point if MMKV is ever adopted.
- **Plain StyleSheet + theme tokens** (`src/constants/theme.ts`), not NativeWind.
- **No Toko/gems shop tab** — spec explicitly forbids coins/gacha; tabs are Beranda, Laboratorium,
  Kejuaraan, Pengguna.
- Practice/exam results are shown **inline** at session end, not on a separate `/result` route.

## Architecture

### Curriculum (`src/curriculum/`) — the pedagogical core, pure functions + data

- `types.ts` — `Level`, `Question`, `LevelMastery`, `LabProgress` shapes; `computeAnswer`.
- `labs/{add,subtract,multiply,divide}.ts` — each exports a `Level[]`: per-level id, tingkat
  (tier), prereqs, a `generate(diff: number) => [a, b]` question generator, and `explainId`.
- `index.ts` — `ALL_LEVELS` registry, lookup helpers (`getLevel`, `levelsForLab`,
  `levelsForTingkat`, `tingkatsForLab`), and `makeQuestion()` — builds a question from a level +
  difficulty dial, avoiding repeats within a session via a `seen` set (widens the difficulty
  dial on collision to escape small value domains like "facts within 5").
- `adaptive.ts` — the edge-of-ability difficulty dial (`diff` 0..1): `initialDiff(mastery)` seeds
  it from current mastery; `nextDiff()` steps it up on correct streaks, down on misses.
- `mastery.ts` — mastery meter math (`masteryDelta`, `clampMastery`), unlock/readiness rules
  (`UNLOCK_THRESHOLD = 70`, `isLevelUnlocked`, `isExamReady`), rank ladder (`rankFor`,
  per-operation Indonesian rank names).
- `exam.ts` — Ujian Kenaikan Tingkat assembly (`buildExam`, `EXAM_SIZE = 10`) and pass/fail
  judging (`judgeExam`: needs ≥9/10 correct AND ≤1 miss on a core (`isCore`) level; on failure,
  routes back to whichever level was missed most).
- `explain.ts` — worked explanations (Bahasa Indonesia) keyed by `explainId`.

Levels form a DAG via `prereqs` (unlock within a tingkat) plus a linear tingkat gate (must pass
the previous tingkat's exam to reach the next). A level's `tipe` (`fakta`/`algoritma`/`konsep`)
governs whether it's timer-eligible (Tantangan Kilat, fact levels only — never punitive, never
gates progression).

### State (`src/state/`) — zustand stores, local-first

- `progress.ts` — `useProgress`: per-lab mastery, tingkat passed, streak/active-day history,
  diamonds. Persisted via zustand's `persist` middleware to AsyncStorage
  (`labmatematika-progress`, versioned with a migration). Every mutating action also emits a
  compact `ProgressMutation` through a decoupled listener (`setMutationListener`) — this module
  never imports `sync.ts`, avoiding an import cycle and letting progress work with no sync
  engine attached (e.g. before login). Streak is *derived* from `activeDates` (Duolingo-style:
  consecutive run ending today or yesterday), not stored as a counter, so it self-heals on app
  open even after a missed day.
- `sync.ts` — offline-first sync engine, zero native modules (zustand + AsyncStorage +
  supabase-js + RN `AppState` only). Every mutation is queued into a persisted AsyncStorage
  outbox and upserted to Supabase (debounced 800ms, exponential backoff retry on failure, flush
  on app foreground). Rows use **deterministic ids** (`${uid}:${fact}`) so upserts are idempotent
  and convergent across devices. On login/foreground it pulls remote rows and merges them via
  `useProgress.mergeRemote()` — union for additive data (tiers, active days), last-write-wins by
  `lastPracticedAt` for mastery, max for attempts/diamonds — never lossy. A one-time full push
  happens only *after* the first successful pull, so a fresh install can't blind-overwrite newer
  server state with empty local state. Also caches a profile snapshot in AsyncStorage so a
  returning onboarded user resolves to `ready` while offline.
- `auth.ts` — `useAuth`: Supabase session + profile (first/last/age), drives `AuthStatus`
  (`loading | signedOut | needsOnboarding | ready`) that `src/app/_layout.tsx`'s router guard
  reads to redirect between `(auth)`, `(onboarding)`, and `(tabs)` route groups. Google sign-in
  is native-only (requires dev build, not Expo Go) via `@react-native-google-signin/google-signin`
  + Supabase `signInWithIdToken`. Calls `startProgressSync`/`stopProgressSync` around session
  changes.

### Routing (`src/app/`, Expo Router, typed routes enabled)

Route groups: `(auth)` (login), `(onboarding)` (first-run profile setup), `(tabs)` (Beranda,
Laboratorium, Kejuaraan, Pengguna — main app shell). Plus stack screens outside the tab bar:
`lab/[operation]` (Peta Keahlian / skill map per lab), `practice/[operation]/[level]` (Latihan
Terarah core loop), `exam/[operation]/[tingkat]` (Ujian Kenaikan Tingkat).

### Supabase (`src/lib/supabase.ts`, `supabase/schema.sql`)

Tables: `profiles`, `level_mastery`, `lab_meta`, `tingkat_passed`, `active_days`, `user_stats` —
every sync-relevant table carries `deleted` for tombstone-style soft deletes and RLS scoped to
`auth.uid() = user_id`. Anonymous-first auth model; Google linking is optional. See
`docs/SETUP.md` for provisioning a project and wiring Google OAuth end-to-end.

## Path aliases

`@/*` → `src/*`, `@/assets/*` → `assets/*` (see `tsconfig.json`). Platform-specific files use
Expo/RN's `.web.tsx` suffix convention (e.g. `animated-icon.web.tsx`, `use-color-scheme.web.ts`).
