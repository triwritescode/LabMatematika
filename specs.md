# LabMatematika — Technical Specification

> **Offline-first native math-practice app for elementary students (grades 1–6).**
> Built with React Native (Expo), grounded in **deliberate practice**, and structured
> as **four independent operation "labs"** (Duolingo model: operation = "language").
>
> **This spec is written in English. The app UI is entirely in Bahasa Indonesia** —
> all user-facing copy, labels, mascot lines, and worked explanations are Indonesian
> (see §16 and `src/i18n/strings.id.ts`).

---

## 1. Concept

| | |
| --- | --- |
| **Name** | LabMatematika ("Math Lab") |
| **Tagline (ID)** | *Latih, uji, kuasai.* |
| **Target user** | Elementary students, grades 1–6 (ages 6–12) |
| **Platform** | Native Android via Expo (iOS-ready from the same codebase) |
| **Distribution** | Google Play Store (AAB) |
| **UI language** | Bahasa Indonesia |
| **Metaphor** | A science *lab*: the child is a little scientist running training experiments (targeted practice), measuring progress (mastery meters), and passing exams (level-up tests) to earn ranks. |

---

## 2. Core Principles

**A. Deliberate practice is the spine.** Specific goals (one sub-skill at a time),
immediate worked-explanation feedback, edge-of-ability difficulty, direct targeting of
weaknesses, and mastery-gated advancement.

**B. Local-first — the cloud is never in the hot path.** Questions are generated
**on-device** by deterministic generators. A child can answer unlimited problems with
**zero backend cost**. Supabase only stores small per-user progress snapshots and syncs
them opportunistically. This is what makes the app economically scalable.

**C. Operation = independent track.** Tambah, Kurang, Kali, and Bagi are four separate
labs, each with its own skill ladder. A child fluent in addition can jump straight into
multiplication — no forced global sequence.

**D. Mastery over speed. No punitive timers.** Advancement is gated by accuracy/mastery,
never by a countdown. Speed is measured only as an **optional** bonus on fact-recall
levels (§6).

---

## 3. Structure: Lab → Tingkat → Level

```
Lab (operation)                     4 independent labs
 └─ Tingkat (tier)                  gated by UJIAN KENAIKAN TINGKAT (level-up exam)
     └─ Level (sub-skill)           unlocked by mastery of prerequisites
         └─ Soal (question)         magnitude adapts per attempt (edge-of-ability)
```

- **Level = a mechanic**, not a digit count (e.g. "carrying", "borrowing across zero",
  "times tables 6–9"). Number magnitude is an **adaptive difficulty dial (`diff` 0..1)**
  *inside* a level — not a separate level. This fixes the classic flaw where `8 + 5`
  (crossing ten) is harder than `42 + 13` yet a digit-based scheme ranks it "easier".
- **Between levels (same Tingkat):** unlock automatically once prerequisites reach the
  ready threshold. Frictionless.
- **Between Tingkat:** must **pass the Ujian Kenaikan Tingkat**. This is a meaningful
  milestone → new rank + certificate.

---

## 4. Modes

### 4.1 Placement Diagnostic (per lab) — "where do I start?"
On first entry to a lab, a short mixed assessment (gampang→susah) places the child at the
right level so an advanced child is not forced to start from `3 + 4`. Re-runnable on demand.

### 4.2 Latihan Terarah (Targeted Practice) — the core loop
Drills **one level (sub-skill) at a time**. No timer. Adaptive magnitude at the edge of
ability. Every miss shows an immediate **worked explanation** (the *method*, not just the
answer). Missed items re-queue in-session and are scheduled for spaced review. Fills the
level's **mastery meter**. This is where ~80% of time is spent. **Blocked practice** (one
skill isolated) — best for *learning* a new skill.

### 4.3 Ujian Kenaikan Tingkat (Level-Up Exam) — the mastery gate
```
- Unlocked when ALL levels in the Tingkat reach ≥ 70% mastery
- 10 questions covering all levels of the Tingkat
- Test conditions: no hints, no worked explanations, no re-queue
- NO TIMER — this gates mastery, not speed
- Pass bar: ≥ 9/10 correct AND ≤ 1 miss on the Tingkat's core (isCore) level
- Pass → next Tingkat unlocks + rank + certificate + celebration
- Fail → app pinpoints the failing level → routes back to Latihan Terarah on it
```

### 4.4 Review / Misi Harian — retention
**Interleaved practice**: mixes several already-mastered levels (mastery ≥ 80%). Research
(Rohrer) shows interleaving beats blocked practice for *retention*; blocked is only for
*learning*. This keeps old skills sharp while new ones are learned.

### 4.5 Tantangan Kilat (Speed Challenge) — optional, fact levels only
See §6. Opt-in, timed, rewards speed, **never fails the child**.

---

## 5. Mastery System

Each level has a **mastery meter (0–100)**.

```
Fill:    correct at edge-of-ability → +mastery; clean streaks → slightly more
Decay:   a miss → small decrease; the item resurfaces + gets a spaced-review slot

Bands:   0–40   Belum dikuasai   (heavy targeted practice)
         41–79  Sedang dilatih
         80–100 Dikuasai

Unlock next level : prerequisites ≥ 70%
Exam readiness    : ALL levels in the Tingkat ≥ 70% (the exam then proves it)
```

Mastery is visualized on a **Peta Keahlian (Skill Map)** per lab, so weaknesses are
concrete and targetable.

---

## 6. Timer Policy (fact vs algorithm)

Timers are **anxiety-inducing** for children when they can cause failure (Boaler, Beilock).
So:

- **Fact levels** (automatic recall: facts within/bridging 10, times tables, division
  facts) → may offer **"Tantangan Kilat"**: an **opt-in** timed mode that awards a
  **"Bintang Kilat ⚡"** for fast + correct answers. It **never causes failure** and never
  gates progression.
- **Algorithm levels** (multi-step procedures: carrying, borrowing across zero, long
  multiplication/division) → **never timed.** Here accuracy and care are the goal.

`Level.tipe` (`"fakta" | "algoritma" | "konsep"`) drives eligibility.

---

## 7. Curriculum Summary

Full generation rules, worked-explanation methods, and common-error notes live in the
companion doc `labmatematika-kurikulum-per-lab.md`. Condensed ladder below (⭐ = core level,
strictly judged in exams; **F** = fact / timer-eligible, **A** = algorithm, **K** = concept):

### 🔵 Lab Tambah
| Tingkat | Level id | Label (ID) | Type |
| --- | --- | --- | --- |
| 1 | `add.within10` | Fakta dasar dalam 10 ⭐ | F |
| 1 | `add.bridge10` | Menjembatani 10 ⭐ | F |
| 2 | `add.2d.nocarry` | Dua angka tanpa menyimpan | A |
| 2 | `add.2d.carry` | Menyimpan ⭐ | A |
| 3 | `add.multi.carry` | Multi-digit menyimpan ⭐ | A |

### 🔴 Lab Kurang
| Tingkat | Level id | Label (ID) | Type |
| --- | --- | --- | --- |
| 1 | `sub.within10` | Fakta dasar dalam 10 ⭐ | F |
| 1 | `sub.bridge10` | Menjembatani 10 ⭐ | F |
| 2 | `sub.2d.noborrow` | Dua angka tanpa meminjam | A |
| 2 | `sub.2d.borrow` | Meminjam ⭐ | A |
| 3 | `sub.multi.borrow` | Multi-digit meminjam ⭐ | A |
| 3 | `sub.borrow.zero` | Meminjam lewat nol ⭐ | A |

### 🟢 Lab Kali
| Tingkat | Level id | Label (ID) | Type |
| --- | --- | --- | --- |
| 1 | `mul.concept` | Perkalian = penjumlahan berulang | K |
| 1 | `mul.table.easy` | Tabel 2, 5, 10 | F |
| 1 | `mul.table.mid` | Tabel 3, 4 | F |
| 1 | `mul.table.hard` | Tabel 6, 7, 8, 9 ⭐ | F |
| 2 | `mul.2d.1d` | 2–3 angka × 1 angka | A |
| 2 | `mul.2d.2d` | 2 angka × 2 angka ⭐ | A |
| 2 | `mul.multi` | Multi-digit | A |

### 🟡 Lab Bagi
| Tingkat | Level id | Label (ID) | Type |
| --- | --- | --- | --- |
| 1 | `div.facts` | Fakta bagi (kebalikan tabel) ⭐ | F |
| 1 | `div.2d.1d` | 2–3 angka ÷ 1 angka | A |
| 2 | `div.long` | Pembagian panjang (pembagi 2 angka) ⭐ | A |
| 2 | `div.large` | Angka besar | A |

**Soft cross-lab link:** `div.facts` benefits from mastered times tables. The mascot
*nudges* the child to strengthen Lab Kali first — but it is a suggestion, **never a lock**.
Division is always whole-number (no remainder) in v1.

---

## 8. Technology Stack

Targets: **Expo SDK 57** (React Native 0.85, React 19.2, New Architecture + Hermes V1),
**Node ≥ 20.19.4**, Android **target API 36**. Install native packages with
`npx expo install` to keep versions aligned; use a **development build** (`expo-dev-client`)
— Expo Go is not sufficient once native modules are added.

### Core & navigation
| Package | Purpose |
| --- | --- |
| `expo`, `expo-router` | Framework + file-based routing |
| `react-native-screens`, `react-native-safe-area-context` | Navigation primitives |
| `react-native-gesture-handler` | Gestures |
| `react-native-reanimated` | **All animations** (replaces web-only Framer Motion) |

### State, sync & storage (offline-first heart)
| Package | Purpose |
| --- | --- |
| `@legendapp/state` (v3) | State + persistence + `syncedSupabase` sync plugin |
| `react-native-mmkv` | Fast local key-value store (Legend-State persistence backend) |
| `@supabase/supabase-js` | Supabase client (auth + Postgres) |
| `react-native-get-random-values`, `react-native-url-polyfill` | **Required** polyfills for supabase-js on RN |
| `uuid` | Client-side id generation before sync (offline-safe writes) |

### UI & styling
| Package | Purpose |
| --- | --- |
| `nativewind` + `tailwindcss` | Tailwind-in-RN styling |
| `react-native-svg` | Skill Map, custom mastery meters, icons |
| `lucide-react-native` | Icon set |
| `@shopify/react-native-skia` *(optional)* | High-fidelity custom meters/skill-map |

### Delight (kid engagement)
| Package | Purpose |
| --- | --- |
| `lottie-react-native` | Mascot "Hitung" (idle/happy/sad/celebrate states) |
| `expo-haptics` | Tactile feedback on correct/incorrect |
| `expo-audio` | SFX (correct, wrong, level-up) — `expo-av` is deprecated |
| `react-native-confetti-cannon` | Exam-pass celebration |

### Device & retention
| Package | Purpose |
| --- | --- |
| `expo-screen-orientation` | Portrait lock |
| `expo-notifications` | **Local** reminders for daily mission & streak (no server push) |

### Observability
| Package | Purpose |
| --- | --- |
| `@sentry/react-native` | Crash & error reporting |
| `posthog-react-native` | Product analytics (funnels: Tingkat completion, drop-off) |

### Dev, build & test
| Package | Purpose |
| --- | --- |
| `expo-dev-client` | Development build (required by native modules) |
| `eas-cli` | EAS Build / Submit / Update |
| `jest-expo`, `@testing-library/react-native` | Unit/component tests |
| Maestro *(separate)* | E2E flows (Expo-integrated) |

### Utilities
| Package | Purpose |
| --- | --- |
| `zod` | Validate data shapes coming back from sync |
| `date-fns` | Streak / spaced-repetition date math |

### Later (optional)
| Package | Purpose |
| --- | --- |
| `react-native-purchases` (RevenueCat) | Parent subscription — **not ads** (kids-app restrictions) |

---

## 9. Architecture

```
┌─────────────────────────── APP (Expo / React Native) ───────────────────────────┐
│  UI & Navigation (Expo Router · Reanimated)                                       │
│         ↕                                                                          │
│  Question Generators (on-device, deterministic) ──► zero backend per question     │
│         ↕                                                                          │
│  Local Store (MMKV + Legend-State observables)  ◄── source of truth, fully offline│
└───────────────────────────────────────────────────────────────────────────────────┘
                                  ↕  sync (progress only, background, when online)
┌──────────────────────────────── SUPABASE ────────────────────────────────────────┐
│  Auth (anonymous → optional parent-email link)                                     │
│  Postgres + Row Level Security (each user reads/writes only their own rows)         │
│  Edge Functions (optional/later: leaderboards, receipt validation)                 │
└───────────────────────────────────────────────────────────────────────────────────┘

Sidecar:  EAS (Build · Submit · Update/OTA)   ·   Sentry (crash)   ·   PostHog (analytics)
```

**Sync strategy.** Progress is single-user, low-conflict data → a heavy sync engine is
unnecessary. Use **Legend-State's `syncedSupabase`** with MMKV persistence and
`created_at` / `updated_at` / `deleted` change-tracking columns; last-write-wins is fine.
Upgrade path: if multi-device conflicts ever become real, swap in **PowerSync** (Postgres↔
local-SQLite, custom conflict resolution) without changing the app's read/write model.

**Auth (kids-app privacy).** Start with **anonymous sign-in** — progress syncs with no PII
collected from the child. Offer optional linking to a parent email only for backup/multi-
device. Keep anything sensitive behind a parent gate.

**Security.** RLS on every table (`auth.uid() = user_id`). Never rely on the anon key alone.

---

## 10. Data Model

### 10.1 Curriculum (in code, `src/curriculum/`)
```typescript
type Operation = "add" | "sub" | "mul" | "div";
type Tipe = "fakta" | "algoritma" | "konsep";

type Level = {
  id: string;              // "add.2d.carry"
  lab: Operation;
  tingkat: number;         // 1..3
  urutan: number;          // order within the tingkat
  labelId: string;         // Bahasa Indonesia display label
  tipe: Tipe;              // "fakta" → Tantangan Kilat eligible
  isCore: boolean;         // strictly judged in exams
  prereqs: string[];       // level ids required first
  generate: (diff: number) => [number, number]; // diff 0..1 = magnitude dial
  explainId: string;       // key into explain.ts (worked method, ID)
};
```

### 10.2 Progress (local + synced)
```typescript
type LevelMastery = {
  levelId: string;
  mastery: number;         // 0..100
  attempts: number;
  lastPracticedAt: string;
  dueForReview?: string;   // spaced repetition
};

type LabProgress = {
  lab: Operation;
  rank: string;            // "Penjumlah Andal", ...
  placementDone: boolean;
  tingkatPassed: number[]; // e.g. [1, 2]
  levels: Record<string, LevelMastery>;
};

type AppProgress = {
  childName: string;
  labs: Record<Operation, LabProgress>;
  streak: { count: number; lastActiveDate: string };
  dailyMission: { date: string; targetLevelId: string; done: boolean };
};
```

### 10.3 Supabase schema (sketch)
Every table carries `updated_at` + `deleted` for Legend-State sync and an RLS policy.
```sql
-- profiles: one per auth user (anonymous or linked)
create table profiles (
  id uuid primary key references auth.users(id),
  child_name text,
  streak_count int default 0,
  streak_last_active date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted boolean default false
);

-- one row per (user, level)
create table level_mastery (
  user_id uuid references auth.users(id),
  level_id text,
  mastery int default 0,
  attempts int default 0,
  last_practiced_at timestamptz,
  due_for_review timestamptz,
  updated_at timestamptz default now(),
  deleted boolean default false,
  primary key (user_id, level_id)
);

-- per-lab meta (rank, tiers passed, placement)
create table lab_progress (
  user_id uuid references auth.users(id),
  lab text,
  rank text,
  placement_done boolean default false,
  tingkat_passed int[] default '{}',
  updated_at timestamptz default now(),
  deleted boolean default false,
  primary key (user_id, lab)
);

-- RLS (apply to every table)
alter table level_mastery enable row level security;
create policy "own rows" on level_mastery
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

---

## 11. Folder Structure

```
labmatematika/
├── app/                                  # Expo Router (file-based routing)
│   ├── _layout.tsx                       # root: providers (Legend-State, Supabase, theme)
│   ├── index.tsx                         # Beranda (Home)
│   ├── progress.tsx                      # all labs, ranks, badges
│   ├── review.tsx                        # interleaved review / daily mission
│   ├── result.tsx                        # practice/exam result screen
│   ├── lab/
│   │   └── [operation].tsx               # Peta Keahlian (Skill Map) per lab
│   ├── placement/
│   │   └── [operation].tsx               # placement diagnostic
│   ├── practice/
│   │   └── [operation]/[level].tsx       # Latihan Terarah (core loop)
│   ├── exam/
│   │   └── [operation]/[tingkat].tsx     # Ujian Kenaikan Tingkat
│   └── challenge/
│       └── [operation]/[level].tsx       # Tantangan Kilat (opt-in, fact levels)
│
├── src/
│   ├── curriculum/                       # the pedagogical core
│   │   ├── labs/
│   │   │   ├── add.ts                     # Level[] for Tambah + generators
│   │   │   ├── subtract.ts
│   │   │   ├── multiply.ts
│   │   │   └── divide.ts
│   │   ├── generator.ts                   # sub-skill-constrained question generation
│   │   ├── adaptive.ts                    # edge-of-ability difficulty dial
│   │   ├── mastery.ts                     # meter math + readiness/unlock rules
│   │   ├── exam.ts                        # exam assembly + pass/fail rules
│   │   ├── placement.ts                   # per-lab placement logic
│   │   ├── review.ts                      # spaced repetition + interleaving
│   │   ├── explain.ts                     # worked explanations (Bahasa Indonesia)
│   │   └── types.ts
│   │
│   ├── features/                          # feature-scoped UI + logic
│   │   ├── practice/
│   │   ├── exam/
│   │   ├── skillmap/
│   │   ├── mascot/
│   │   └── challenge/
│   │
│   ├── components/                        # shared UI
│   │   ├── Numpad.tsx
│   │   ├── QuestionDisplay.tsx
│   │   ├── MasteryMeter.tsx
│   │   ├── FeedbackOverlay.tsx
│   │   ├── WorkedExample.tsx
│   │   ├── RankBadge.tsx
│   │   ├── Certificate.tsx
│   │   ├── StreakBadge.tsx
│   │   └── Confetti.tsx
│   │
│   ├── state/                             # Legend-State observables
│   │   ├── progress$.ts
│   │   ├── session$.ts
│   │   └── settings$.ts
│   │
│   ├── lib/
│   │   ├── supabase.ts                    # client init
│   │   ├── sync.ts                        # syncedSupabase config
│   │   ├── mmkv.ts
│   │   ├── audio.ts
│   │   ├── haptics.ts
│   │   ├── notifications.ts               # local reminders
│   │   ├── sentry.ts
│   │   └── analytics.ts                   # PostHog wrapper
│   │
│   ├── i18n/
│   │   └── strings.id.ts                  # ALL Bahasa Indonesia UI copy
│   │
│   ├── theme/
│   │   ├── colors.ts                      # per-operation colors + tokens
│   │   └── tokens.ts
│   │
│   ├── hooks/
│   └── types/
│
├── supabase/
│   ├── migrations/                        # SQL: tables + RLS policies
│   └── config.toml
│
├── assets/
│   ├── mascot/                            # Lottie JSON (idle, happy, sad, celebrate)
│   ├── sounds/                            # correct, wrong, levelup, exam-pass
│   ├── fonts/
│   └── icons/                             # adaptive icon, splash
│
├── __tests__/                             # (or co-located *.test.ts)
├── app.config.ts                          # Expo config + plugins (dynamic)
├── eas.json                               # build/submit/update profiles
├── tailwind.config.js
├── metro.config.js
├── babel.config.js
├── tsconfig.json
├── .env.local                            # SUPABASE_URL, SUPABASE_ANON_KEY (public)
└── package.json
```

---

## 12. Routes (Expo Router)

| Route | Screen |
| --- | --- |
| `/` | Beranda — mascot, streak, daily mission, four lab cards |
| `/lab/[operation]` | Peta Keahlian — mastery meters, level path, exam entry |
| `/placement/[operation]` | Placement diagnostic |
| `/practice/[operation]/[level]` | Latihan Terarah (core loop) |
| `/exam/[operation]/[tingkat]` | Ujian Kenaikan Tingkat (test conditions, no timer) |
| `/challenge/[operation]/[level]` | Tantangan Kilat (opt-in, fact levels only) |
| `/review` | Interleaved review / daily mission |
| `/result` | Practice result / exam verdict |
| `/progress` | All labs, ranks, badges |

---

## 13. Engagement (subordinate to mastery)

```
🦊 Mascot "Hitung"    fox-in-a-lab-coat (Lottie): encourages, explains, celebrates; greets by name
📊 Peta Keahlian      per-lab mastery meters as a skill map the child grows
🏅 Ranks & certs      per lab, earned by passing each Tingkat (see below)
🔥 Streak             consecutive practice days (local reminder)
🎯 Misi harian        one specific level goal per day
⚡ Bintang Kilat       optional speed bonus on fact levels only (never punitive)
🎉 Celebrations       confetti + haptics + mascot animation on mastery & exam passes
```

**Rank ladders (ID):**
Tambah: *Penjumlah Pemula → Penjumlah Andal → Penjumlah Ahli* ·
Kurang: *Pengurang Pemula → Pengurang Andal → Pengurang Ahli* ·
Kali: *Pengali Pemula → Ahli Tabel → Pengali Ahli* ·
Bagi: *Pembagi Pemula → Pembagi Andal → Pembagi Ahli*.

No coins/gacha. Rewards map to mastery milestones only.

---

## 14. UX Principles for Young Kids

```
Large targets        questions ≥ 28px, numpad targets ≥ 56px
Per-lab color        Tambah #3B82F6 · Kurang #EF4444 · Kali #22C55E · Bagi #EAB308
Instant feedback     no loading, no delay
No timer (default)   accuracy & mastery over speed (speed only opt-in, fact levels)
Encouraging tone     warm Bahasa Indonesia, never punishing
Mistakes = learning  every miss shows the method, framed kindly
Portrait lock        designed for a phone held upright
No ads, no IAP (v1)  family-safe; offline-capable
```

---

## 15. Release & Play Store (as of mid-2026)

- **Build/ship with EAS:** `eas build` → `eas submit`. Adopt **EAS Update (OTA)** from day
  one to push JS/content/curriculum fixes without a store review.
- **Closed-testing gate:** personal developer accounts created after 13 Nov 2023 must run a
  closed test with **≥ 12 opted-in testers for 14 continuous days** before applying for
  production. Organization accounts are exempt. Budget this time.
- **Target API 36 (Android 16):** required for new apps/updates from 31 Aug 2026. SDK 57 covers this.
- **Format & signing:** Android App Bundle (AAB) + Play App Signing.
- **Developer verification:** identity verification program (may require government ID).
- **Kids compliance:** complete the Data Safety form; consider the **Designed for Families**
  program (COPPA-aligned). Keep data collection minimal (anonymous auth helps here).
- **Fees:** $25 one-time developer registration. (A free limited-distribution track exists
  for hobbyists — up to 20 devices, no ID — useful for early testing.)

---

## 16. Bahasa Indonesia UI Strings (reference)

Centralized in `src/i18n/strings.id.ts`. The spec is English; **the app is not.**

```
Beranda                          Home
Lab Tambah / Kurang / Kali / Bagi
Peta Keahlian                    Skill Map
Penguasaan                       Mastery
Belum dikuasai / Sedang dilatih / Dikuasai
Latihan Terarah                  Targeted Practice
Ujian Kenaikan Tingkat           Level-Up Exam
Tantangan Kilat                  Speed Challenge
Tanpa bantuan. Semangat!         No help. You got this!
Targetmu hari ini: …             Today's target: …
Soal {n} dari 10                 Question n of 10
Benar! / Belum tepat             Correct! / Not quite
Lihat caranya                    Show me how
LULUS! / Hampir!                 PASSED! / Almost!
Kamu naik ke Tingkat {n}!        You've reached Tier n!
Rank baru: …                     New rank: …
Sertifikat …                     Certificate …
Perlu dikuatkan: …               Needs strengthening: …
Bintang Kilat ⚡                  Speed Star
Runtutan {n} hari                n-day streak
Misi harian                      Daily mission
Ulangi / Lanjut / Beranda        Retry / Next / Home
```
Mascot lines (ID): *"Halo, {nama}! Siap latihan?"*, *"Keren, penguasaanmu naik!"*,
*"Hampir benar — fokus ke satuannya ya."*, *"Kamu LULUS! Bangga banget! 🎉"*

---

## 17. Build Order

```
Phase 1 — Deliberate-practice core (offline, no backend yet)
  Expo SDK 57 + expo-router + TS + NativeWind
  curriculum/types + one lab's Level[] + sub-skill generators
  Latihan Terarah loop + custom Numpad
  Immediate worked-explanation feedback (explain.ts)
  Mastery meters + Peta Keahlian
  Local persistence via MMKV + Legend-State (no sync yet)
  → make a development build early (native modules)

Phase 2 — Diagnose & gate
  Placement diagnostic (per lab)
  Adaptive edge-of-ability (adaptive.ts)
  Ujian Kenaikan Tingkat (test conditions, strict bar, NO timer)
  Exam verdict + fail-routing
  Ranks + certificates
  Fill out all four labs' curricula

Phase 3 — Cloud sync & retention
  Supabase project + schema + RLS
  Anonymous auth
  Legend-State syncedSupabase + MMKV
  Spaced review + interleaved daily mission + streak (local notifications)
  Tantangan Kilat (fact levels, opt-in)

Phase 4 — Polish, observability & release
  Mascot (Lottie) + confetti + haptics + sfx
  Sentry + PostHog
  Portrait lock, a11y, large targets
  EAS Build/Submit/Update, Data Safety, closed testing → production
```

---

## 18. Out of Scope (v1)

```
❌ Login/passwords (anonymous only; optional parent-email link)
❌ Leaderboards / multiplayer            ❌ Server-side question bank
❌ Real-money purchases (RevenueCat later)  ❌ Fractions / decimals
❌ Punitive timed modes                  ❌ Multiple child profiles (single profile)
❌ Ads
```

---

## 19. Open Decisions

1. **Order of operations (`order.ops`, e.g. `3 + 4 × 2`).** Not pure single-operation
   arithmetic. Options: (a) optional 5th "Lab Campuran", or (b) bonus Tingkat at the end of
   Lab Kali. Not yet included.
2. **Division with remainder (`17 ÷ 5 = 3 r2`).** Currently out of scope (whole-number
   only). Could become Lab Bagi Tingkat 3.
3. **Skip counting (`count.skip`).** Natural bridge to multiplication — could be an optional
   opening level in Lab Kali Tingkat 1, or a mini-drill in Lab Tambah.
```