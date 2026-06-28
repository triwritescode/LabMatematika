# LabMatematika — Product Specs

> An offline math practice web app for elementary school kids. Built as a Next.js PWA.
> Four arithmetic operations, each with difficulty levels based on digit count,
> plus engagement and learning mechanics designed to make kids _want_ to keep practicing.
>
> **Specs are in English. The app's UI copy is in Bahasa Indonesia** (see §16 for strings).

---

## 1. Concept

**Name:** LabMatematika (working title)

**Tagline (ID):** Belajar berhitung jadi seru!

**Target user:** Elementary students, grades 1–6 (ages 6–12)

**Platform:** Progressive Web App (PWA) — installable to home screen on any device

**UI Language:** Bahasa Indonesia (all kid-facing text)

**Mode:** Fully offline after first load — no internet required

**Core loop:**

```
Pick operation → Pick level → Practice → Earn rewards → Review mistakes → Level up
```

**Design philosophy:** Two goals held together:

1. **Teach, don't just test** — reinforce correct methods, learn from mistakes, adapt difficulty.
2. **Make it delightful** — a friendly mascot, collectibles, and a sense of adventure
   so a 7-year-old chooses this over a game.

**Why a PWA:** No app store needed. Open the URL once, tap "Add to Home Screen,"
and it works offline like a native app.

---

## 2. The Hook: What Makes Kids Come Back

Engagement is designed around _intrinsic progress made visible_, never time pressure.

### 2.1 Mascot companion — "Hitung" the friendly fox 🦊

A character that lives in the app and reacts to the kid:

```
- Cheers on correct answers ("Hebat!", "Keren banget!")
- Gently encourages on mistakes ("Gak apa-apa, coba lagi ya!")
- Celebrates level-ups and streaks with a little animation
- Greets the kid by name on the home screen ("Halo, Adi! 👋")
```

The mascot gives the app personality and makes practice feel like play with a buddy.

### 2.2 Coins & a sticker album (collection loop)

```
- Earn coins (koin) for correct answers and completed sessions
- Spend coins in a "Toko" (shop) on cosmetic rewards:
    - Mascot outfits (topi, kacamata, kostum)
    - App themes / color skins
    - Sticker packs
- Stickers fill a "Album Stiker" — a visual collection that grows over time
```

Collecting is one of the strongest non-coercive motivators for this age group.

### 2.3 Adventure map (instead of a plain level list)

```
Levels are shown as stops on a winding path / journey map:
    🏁 Start → ⭐ Level 1 → ⭐ Level 2 → 🔒 Level 3 → 🏆 Finish
Each operation is its own "world" with its own scenery and color.
Completing a level visibly advances the mascot along the path.
```

### 2.4 Badges (lencana) for milestones

```
🏅 "Jago Tambah"        — finish all addition levels
🔥 "Rajin 7 Hari"       — 7-day streak
💯 "Sempurna"           — 10/10 in a Challenge
⚡ "Cepat Tepat"        — 10 correct in a row
🎯 "Pejuang Latihan"    — 100 questions answered
```

### 2.5 Daily mission (misi harian)

```
One simple goal per day, e.g.:
  "Selesaikan 1 sesi latihan hari ini" → reward koin + keep the streak alive
Light, achievable, builds a daily habit without nagging.
```

### 2.6 Celebrations

```
- Confetti burst on level-up
- Star-burst animation on correct answers
- Mascot dance + fanfare sound on a perfect score
```

---

## 3. Operations & Levels

### Four Operations

```
➕ Tambah     (Addition)
➖ Kurang     (Subtraction)
✖️ Kali       (Multiplication)
➗ Bagi       (Division)
```

### Levels per Operation

Each operation has 5 levels. Difficulty scales with the number of digits.

| Level | Description       | Add        | Subtract   | Multiply | Divide   |
| ----- | ----------------- | ---------- | ---------- | -------- | -------- |
| 1     | Single digit      | 3 + 4      | 9 − 5      | 3 × 4    | 8 ÷ 2    |
| 2     | Two digits        | 65 + 6     | 45 − 8     | 12 × 4   | 24 ÷ 6   |
| 3     | Three digits      | 124 + 37   | 200 − 45   | 23 × 12  | 144 ÷ 12 |
| 4     | Four digits       | 1250 + 348 | 3000 − 456 | 125 × 24 | 256 ÷ 16 |
| 5     | Mixed / challenge | 9999 + 1   | 1000 − 999 | 99 × 99  | 999 ÷ 27 |

### Generation Rules per Operation

**Addition** — L1: two 1-digit, result ≤ 18. L2: ≥ one 2-digit. L3–4: larger digits.
L5: mixed + tricky round numbers. Sub-skill flag: _carrying_.

**Subtraction** — always first ≥ second (no negatives). Same digit progression.
Sub-skill flag: _borrowing_.

**Multiplication** — L1: 1×1 digit (times tables 1–9). L2: 2×1. L3: 2×2. L4: 3×2.
L5: mixed + large.

**Division** — always whole-number result (no remainder). L1: result 1–9, divisor 1–9.
L2: 2-digit result, 1-digit divisor. L3: 2-digit result, 2-digit divisor.
L4: 3-digit result, 2-digit divisor. L5: mixed + large.

---

## 4. Practice Modes

### 4.1 Latihan (Practice — default, low-pressure)

```
- 10 questions, no timer
- Instant feedback; on a wrong answer, show the correct answer + a worked explanation
- Wrong questions re-queued once at the end
- Goal: learn, not score
```

### 4.2 Tantangan (Challenge — unlocks the next level)

```
- 10 questions, no re-queue
- Instant correct/incorrect feedback, no mid-session explanation
- Score ≥ 7/10 unlocks the next level
- Mistakes saved for end-of-session review
```

### 4.3 Latihan Campur (Mixed Review — mastery)

```
- Pulls questions across ALL unlocked levels of one operation
- Weighted toward the kid's weakest sub-skills (carrying, borrowing, etc)
- No level gating — pure retention practice
```

---

## 5. Adaptive Difficulty (within a level)

The generator nudges difficulty based on recent performance — productive struggle zone.

```
3 correct in a row   → bias toward the harder end of the level's range
2 wrong in a row     → bias toward the easier end, rebuild confidence
Sub-skill weakness   → surface more of that sub-skill
```

Always stays within the chosen level's digit rules — never jumps levels mid-session.

---

## 6. Learning From Mistakes

### Mid-session (Practice Mode only)

```
65 + 6 = 71
Kamu menulis 611.
Tips: jumlahkan satuannya dulu. 5 + 6 = 11, tulis 1, simpan 1.
Lalu 6 + 1 = 7. Jawabannya: 71.
```

### End-of-session review (all modes)

```
┌────────────────────────────┐
│  Yuk, lihat soal yang salah│
│  ❌ 45 − 8                 │
│     Kamu: 43 · Jawaban: 37 │
│     [Lihat caranya]        │
│  ❌ 23 × 12                │
│     Kamu: 256 · Jawaban:276│
│     [Lihat caranya]        │
└────────────────────────────┘
```

Every mistake becomes a teaching moment instead of just a lost point.

---

## 7. Tech Stack

```
Framework        Next.js 15 (App Router)
Language         TypeScript (strict)
UI Runtime       React 19
Styling          Tailwind CSS v4
State            Zustand (global state + progress + rewards)
Persistence      LocalStorage (or IndexedDB if data grows)
PWA              next-pwa / Serwist (service worker + manifest + offline cache)
Animations       Framer Motion (celebrations, mascot, confetti)
Sound            HTML5 Audio API (preloaded + unlocked on first tap)
Icons            Lucide React
Testing          Vitest + React Testing Library + Playwright
Hosting          Vercel
```

No backend, no API, no internet required after first load.

---

## 8. PWA Configuration

```
manifest.json
  - name "LabMatematika", short_name, icons (192 + 512), theme_color
  - display: "standalone", orientation: "portrait", start_url: "/"

Service worker (next-pwa or Serwist)
  - Precache all static assets: HTML, JS, CSS, sounds, mascot art, icons
  - Cache-first — works with zero network

Offline behavior
  - First visit (online): SW installs, caches everything
  - After: fully offline, instant load
  - Progress + rewards saved to LocalStorage
```

### iOS PWA gotchas

```
- Audio needs a user tap before it can play → preload + unlock on first tap.
- "Add to Home Screen" on iOS is manual → show a one-time hint for iOS users.
```

---

## 9. Pages / Routes

```
/                          Home — mascot, streak, pick operation
/operation/[id]            Adventure map — pick level + mode
/quiz/[operation]/[level]  Active practice screen
/review                    End-of-session mistake review
/result                    Result + rewards earned
/progress                  Progress, badges, sub-skill weak spots
/shop                      Toko — spend coins on cosmetics
/album                     Sticker album (collection)
```

---

## 10. Screen Details

### 10.1 Home (Beranda)

```
┌────────────────────────────┐
│  🦊 "Halo, Adi! Siap       │
│      latihan hari ini?"    │
│                            │
│  🔥 Runtutan 3 hari        │
│  🪙 120 koin               │
│                            │
│  Pilih operasi:            │
│  ┌────────┐  ┌────────┐   │
│  │   ➕   │  │   ➖   │   │
│  │ Tambah │  │ Kurang │   │
│  ┌────────┐  ┌────────┐   │
│  │   ✖️   │  │   ➗   │   │
│  │  Kali  │  │  Bagi  │   │
│                            │
│  🎯 Misi: selesaikan 1 sesi│
│  [📊 Progres] [🛍️ Toko]    │
└────────────────────────────┘
```

### 10.2 Adventure Map (Peta) — level + mode select

```
┌────────────────────────────┐
│  ← Dunia Tambah            │
│                            │
│      🏁                    │
│       \                    │
│   ⭐ Level 1 (selesai)     │
│        \                   │
│      ⭐ Level 2 (selesai)  │
│         \                  │
│     🦊 Level 3 (main!)     │
│          \                 │
│       🔒 Level 4           │
│           \                │
│         🏆 Level 5         │
│                            │
│  Mode: ◉ Latihan           │
│        ○ Tantangan         │
│        ○ Latihan Campur    │
└────────────────────────────┘
```

The mascot icon sits on the kid's current stop. Completing a level moves it forward.

### 10.3 Quiz (Soal)

```
┌────────────────────────────┐
│  ← Tambah · Level 2       │
│  Soal 3 dari 10            │
│  ████████░░░░░░░  🪙 30    │
│                            │
│         65 + 6 =           │
│      ┌──────────────┐      │
│      │      ?       │      │
│      └──────────────┘      │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ 7  │ │ 8  │ │ 9  │     │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ 4  │ │ 5  │ │ 6  │     │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ 1  │ │ 2  │ │ 3  │     │
│        ┌────┐  ┌────────┐  │
│        │ 0  │  │ ⌫ Hapus│  │
└────────────────────────────┘
```

Input: **custom on-screen numpad**, not the device keyboard — bigger targets, no
keyboard covering the screen, more child-friendly.

### 10.4 Inline feedback

```
✅ Benar! +10 🪙           (green, star burst, mascot cheer)
❌ Belum tepat. Yang benar 71  (red, gentle; mascot encourages)
   [Lihat caranya]         (Practice Mode only)
```

### 10.5 Result (Hasil)

```
┌────────────────────────────┐
│      🦊 🎉 Hebat!          │
│         ⭐⭐⭐             │
│      8 dari 10 benar       │
│  🪙 +80 koin               │
│  🔥 Runtutan 4 hari        │
│  🏅 Lencana baru: "Sempurna"│
│  🔓 Level 4 terbuka!       │
│  [🔄 Ulangi] [➡️ Lanjut]   │
│       [🏠 Beranda]         │
└────────────────────────────┘
```

Stars: ⭐⭐⭐ 9–10 · ⭐⭐ 7–8 · ⭐ 5–6 · (<5 → "Ayo coba lagi!", no lock).

### 10.6 Progress (Progres)

```
┌────────────────────────────┐
│  📊 Progres Kamu           │
│  ➕ Tambah                 │
│  ⭐⭐⭐ L1 ⭐⭐ L2 ⭐ L3   │
│  🔒 L4  🔒 L5             │
│  Perlu latihan: menyimpan  │
│                            │
│  🏅 Lencana: 4 terkumpul   │
└────────────────────────────┘
```

"Perlu latihan" (weak spot) tells the kid/parent exactly which sub-skill to work on.

### 10.7 Shop (Toko) & Album

```
Toko:  grid of cosmetic items priced in koin
       (mascot hats, glasses, costumes, app themes, sticker packs)
Album: a collection grid that fills as stickers are earned/bought
```

---

## 11. Question Generation

```typescript
function generateQuestion(
  operation: Operation,
  level: Level,
  recentPerformance: Performance,
): Question {
  const difficulty = adaptDifficulty(level, recentPerformance);
  const [a, b] = generateOperands(operation, level, difficulty);
  const answer = compute(operation, a, b);
  const subSkill = detectSubSkill(operation, a, b); // carrying, borrowing, etc
  return { a, b, operation, level, answer, subSkill };
}
```

10 questions per session, no duplicates within a session.

---

## 12. Scoring, Rewards & Progression

```
Correct answer    +10 pts, +10 koin
Wrong answer      +0
No time bonus     accuracy over speed

Coins             spent in Toko on cosmetics
Level unlock      Challenge score ≥ 7/10 unlocks next level
Streak            consecutive days with ≥ 1 completed session
Badges            milestone achievements (see §2.4)
Daily mission     1 simple goal/day → coin reward + streak
```

---

## 13. Data & Storage

LocalStorage. No account, no cloud sync.

```typescript
type SubSkillStats = {
  carrying?: { correct: number; total: number };
  borrowing?: { correct: number; total: number };
};
type LevelProgress = {
  unlocked: boolean;
  bestScore: number;
  bestStars: number;
  attempts: number;
  lastPlayedAt: string;
};
type OperationProgress = {
  levels: Record<string, LevelProgress>;
  subSkills: SubSkillStats;
};
type Rewards = {
  coins: number;
  ownedItems: string[]; // cosmetic ids purchased
  stickers: string[]; // collected sticker ids
  badges: string[]; // earned badge ids
  equippedItems: { hat?: string; theme?: string };
};
type AppProgress = {
  childName: string;
  add: OperationProgress;
  subtract: OperationProgress;
  multiply: OperationProgress;
  divide: OperationProgress;
  streak: { count: number; lastActiveDate: string };
  dailyMission: { date: string; done: boolean };
  rewards: Rewards;
};
```

> Note: artifacts on Claude.ai can't use LocalStorage, but a deployed Next.js PWA
> on Vercel can. Use LocalStorage (or IndexedDB if data grows) in production.

---

## 14. Folder Structure

```
LabMatematika/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # Home (Beranda)
│   │   ├── progress/page.tsx
│   │   ├── shop/page.tsx                # Toko
│   │   ├── album/page.tsx               # Sticker album
│   │   ├── operation/[id]/page.tsx      # Adventure map
│   │   ├── quiz/
│   │   │   ├── [operation]/[level]/page.tsx
│   │   │   ├── review/page.tsx
│   │   │   └── result/page.tsx
│   │   ├── layout.tsx                   # root layout + PWA meta
│   │   └── globals.css
│   ├── components/
│   │   ├── Mascot.tsx                   # animated fox + speech bubble
│   │   ├── OperationCard.tsx
│   │   ├── AdventureMap.tsx
│   │   ├── LevelStop.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── Numpad.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StarRating.tsx
│   │   ├── FeedbackOverlay.tsx
│   │   ├── WorkedExample.tsx
│   │   ├── QuestionDisplay.tsx
│   │   ├── CoinCounter.tsx
│   │   ├── StreakBadge.tsx
│   │   ├── BadgeGrid.tsx
│   │   ├── Confetti.tsx
│   │   ├── ShopItem.tsx
│   │   └── StickerAlbum.tsx
│   ├── lib/
│   │   ├── generator.ts
│   │   ├── adaptive.ts
│   │   ├── subskills.ts
│   │   ├── explain.ts                   # worked explanations (Bahasa Indonesia)
│   │   ├── scorer.ts
│   │   ├── rewards.ts                   # coins, badges, unlock logic
│   │   ├── storage.ts
│   │   ├── audio.ts                     # preload + iOS-safe unlock
│   │   ├── strings.ts                   # all Bahasa Indonesia UI copy
│   │   └── constants.ts
│   ├── stores/
│   │   └── useProgressStore.ts
│   └── types/
│       └── index.ts
├── public/
│   ├── manifest.json
│   ├── icons/ (icon-192.png, icon-512.png)
│   ├── mascot/ (fox poses: idle, happy, sad, celebrate)
│   └── sounds/ (correct.mp3, wrong.mp3, levelup.mp3, coin.mp3)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## 15. UX Principles for Young Kids

```
Large font        ≥ 28px questions, ≥ 18px UI
Large buttons     ≥ 56×56px numpad
Bright colors     each operation has its own color/world
Instant feedback  no loading, no delay
No timer          accuracy over speed — never rush a child
Positive sound    encouraging audio, never punishing
No ads, no IAP    fully offline, family-safe
Simple language   short, warm, encouraging Bahasa Indonesia
Portrait lock     designed for a phone held upright
Mascot presence   a friendly face on every screen
```

### Color per Operation (world)

```
Tambah    Blue    #3B82F6
Kurang    Red     #EF4444
Kali      Green   #22C55E
Bagi      Amber   #EAB308
```

---

## 16. Bahasa Indonesia UI Strings (reference)

Centralize in `lib/strings.ts`.

```
Beranda           Home
Pilih operasi     Pick an operation
Tambah / Kurang / Kali / Bagi
Pilih level       Pick a level
Mode: Latihan / Tantangan / Latihan Campur
Soal {n} dari 10  Question n of 10
Benar!            Correct!
Belum tepat       Not quite
Yang benar {x}    The answer is x
Lihat caranya     Show me how
Hebat!            Great job!
Ayo coba lagi!    Try again!
{n} dari 10 benar n of 10 correct
Level {n} terbuka! Level n unlocked!
Runtutan {n} hari n-day streak
Koin              Coins
Toko              Shop
Album Stiker      Sticker album
Lencana           Badges
Misi harian       Daily mission
Perlu latihan: …  Needs practice: …
Ulangi / Lanjut / Beranda   Retry / Next / Home
```

Mascot lines (examples): "Halo, {nama}! 👋", "Keren banget!", "Hampir benar, semangat!",
"Wah, kamu hebat hari ini!", "Yuk lanjut latihan!"

---

## 17. Out of Scope

```
❌ Login / user accounts
❌ Leaderboards or multiplayer
❌ Server-side question bank
❌ Real-money purchases (coins are earned only, never bought)
❌ Fractions, decimals, advanced operations
❌ Timed / time-pressure modes
❌ App store submission (installable PWA instead)
❌ Multiple profiles (one device = one child) — name only, single profile
```

---

## 18. Build Order

```
Phase 1 — Core loop
  Next.js + TS + Tailwind setup
  Home + 4 operations
  Level select + mode + lock system
  Quiz + custom numpad + question generation
  Inline correct/wrong feedback
  Result + star rating

Phase 2 — Learning mechanics
  Worked explanations ("Lihat caranya")
  End-of-session mistake review
  Adaptive difficulty
  Sub-skill tracking + "Perlu latihan" weak spots

Phase 3 — Engagement layer
  Mascot (poses + speech) on every screen
  Coins + Toko + cosmetic items
  Sticker album + badges
  Adventure map view for level select
  Daily mission + streak
  Confetti + sound + Framer Motion celebrations

Phase 4 — PWA + polish
  manifest.json + service worker (next-pwa / Serwist)
  Offline caching + install-to-home-screen
  iOS audio unlock + install hint
  LocalStorage persistence
  Cross-device QA (Android Chrome + iOS Safari, various sizes)
```
