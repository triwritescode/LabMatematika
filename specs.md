# LabMatematika — Product Specs

> An offline math practice web app for elementary school kids, built as a Next.js PWA
> and grounded in **deliberate practice**. Kids don't just drill random problems —
> the app diagnoses their exact weak sub-skill, trains it at the edge of their ability
> with immediate feedback, and only lets them advance by passing a **Level-Up Exam**
> that proves mastery.
>
> **Specs are in English. The app's UI copy is in Bahasa Indonesia** (see §17).

---

## 1. Concept

**Name:** LabMatematika ("Math Lab")

**Tagline (ID):** Latih, uji, kuasai.

**Target user:** Elementary students, grades 1–6 (ages 6–12)

**Platform:** Progressive Web App (PWA) — installable, fully offline after first load

**UI Language:** Bahasa Indonesia

**Metaphor:** A _lab_. The kid is a little scientist who runs training experiments
(targeted practice), measures progress (mastery meters), and takes exams (level-up tests)
to earn their next rank. The lab framing reinforces the idea that improvement is
_systematic and measured_, not random.

---

## 2. Why Deliberate Practice (the spine of the app)

Anders Ericsson's deliberate practice says skill is built by: specific goals, full focus,
immediate feedback, working at the edge of ability, and targeting weaknesses — not by
mindless repetition. Every core feature maps to one of these principles.

| Deliberate practice principle             | How LabMatematika implements it                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Specific, well-defined goals**          | Each session targets ONE sub-skill (e.g. "carrying in 2-digit addition"), not "addition" in general.       |
| **Full focus, one skill at a time**       | Targeted Practice isolates a single sub-skill and drills only that.                                        |
| **Immediate, informative feedback**       | Wrong answers show a step-by-step worked explanation instantly, not just the answer.                       |
| **Edge of ability (productive struggle)** | Adaptive difficulty keeps each problem just beyond the kid's current comfort — not too easy, not crushing. |
| **Target weaknesses directly**            | A diagnostic + mastery meters find the exact weak sub-skill and route practice straight to it.             |
| **Repetition with refinement**            | The same weak sub-skill is repeated across sessions until its mastery meter fills.                         |
| **Push beyond comfort to advance**        | A Level-Up Exam gates progression — you only advance by _demonstrating_ mastery.                           |
| **Mental representations**                | Worked explanations teach the _method_ (place value, carrying), building understanding, not memorization.  |

---

## 3. The Three Modes (restructured around deliberate practice)

### 3.1 Diagnostik (Diagnostic) — "where am I?"

```
- A short, mixed set (8–10 questions) across a level's sub-skills
- No score shown as pass/fail — its only job is to LOCATE the kid's edge
- Output: identifies the weakest sub-skill(s) and sets the practice target
- Run automatically the first time a kid enters a level, or on demand
```

This is the "specific goal" step — it tells the kid exactly what to work on.

### 3.2 Latihan Terarah (Targeted Practice) — the core loop

```
- Drills ONE sub-skill at a time (the current weak target)
- No timer, no pressure — full focus on the skill
- Adaptive: each question sits at the edge of the kid's ability
- Immediate worked-explanation feedback on every miss
- Wrong items re-queued within the session AND scheduled for spaced review
- Fills the sub-skill's MASTERY METER as the kid gets them right consistently
- Goal: raise mastery, not chase a score
```

This is where the kid spends ~80% of their time. It is _the_ deliberate practice engine.

### 3.3 Ujian Kenaikan Level (Level-Up Exam) — the mastery gate

```
- Unlocked only when the level's sub-skills reach a "ready" mastery threshold
- A real test: 10 questions covering ALL sub-skills of the level
- TEST CONDITIONS: no hints, no worked explanations mid-exam, no re-queue
- PASS BAR is strict (mastery, not "good enough"):
    - ≥ 9/10 correct, AND
    - no more than 1 miss on the level's core sub-skill
- PASS → next level unlocks + a rank/certificate + celebration
- FAIL → app identifies which sub-skill caused the misses and routes the kid
          back to Targeted Practice on exactly that skill ("Hampir! Ayo kuatkan: menyimpan")
- The exam can be retaken anytime after a bit more targeted practice
```

The exam is deliberately distinct from practice — higher stakes, test conditions, and a
mastery-level bar. It's the moment the kid _proves_ the skill, which is what makes
advancement meaningful.

---

## 4. Operations, Levels & Sub-skills

### Operations

```
➕ Tambah (Addition)   ➖ Kurang (Subtraction)
✖️ Kali (Multiplication) ➗ Bagi (Division)
```

### Levels (digit-based difficulty)

| Level | Description       | Add        | Subtract   | Multiply | Divide   |
| ----- | ----------------- | ---------- | ---------- | -------- | -------- |
| 1     | Single digit      | 3 + 4      | 9 − 5      | 3 × 4    | 8 ÷ 2    |
| 2     | Two digits        | 65 + 6     | 45 − 8     | 12 × 4   | 24 ÷ 6   |
| 3     | Three digits      | 124 + 37   | 200 − 45   | 23 × 12  | 144 ÷ 12 |
| 4     | Four digits       | 1250 + 348 | 3000 − 456 | 125 × 24 | 256 ÷ 16 |
| 5     | Mixed / challenge | 9999 + 1   | 1000 − 999 | 99 × 99  | 999 ÷ 27 |

### Sub-skills (the unit deliberate practice actually targets)

This is the key shift: practice and mastery are tracked at the **sub-skill** level,
not just the level.

```
Addition
  - basic facts (single-digit sums)
  - no-carry multi-digit
  - carrying (single carry)
  - carrying (multiple carries)

Subtraction
  - basic facts
  - no-borrow multi-digit
  - borrowing (single borrow)
  - borrowing across zero (e.g. 200 − 45)

Multiplication
  - times tables (per number: ×2 … ×9)
  - 2-digit × 1-digit (with carry)
  - 2-digit × 2-digit
  - multi-digit

Division
  - basic facts (inverse of times tables)
  - 2-digit ÷ 1-digit
  - long division (2-digit divisor)
  - division with larger numbers
```

Generation rules (unchanged constraints): subtraction never negative; division always
whole-number; multiplication L1 = times tables 1–9.

---

## 5. Mastery System

Each sub-skill has a **mastery meter** (0–100%). This is what drives everything.

```
How it fills:
  - Correct answer on that sub-skill, at edge-of-ability difficulty → +mastery
  - Faster/cleaner correct streaks → slightly more
  - A miss → small decrease (it resurfaces in practice + spaced review)

Mastery bands:
  0–40%    Belum dikuasai   (Not yet — heavy targeted practice)
  41–80%   Sedang dilatih   (In progress)
  81–100%  Dikuasai         (Mastered)

Level-up readiness:
  A level's exam unlocks when ALL its sub-skills reach ≥ 70%
  (≈ "ready to be tested", not yet proven — the exam proves it)
```

Mastery is shown visually on a **Skill Map** so the kid sees exactly what's strong and
what needs work — making weaknesses concrete and targetable.

---

## 6. The Deliberate Practice Loop (how it all connects)

```
Enter a level
   ↓
Diagnostik  →  finds weakest sub-skill, sets the target
   ↓
Latihan Terarah (target = weakest sub-skill)
   ↓        ↑ immediate worked-explanation feedback
   ↓        ↑ adaptive edge-of-ability difficulty
   ↓        ↑ repeat + spaced review until mastery meter rises
   ↓
All sub-skills ≥ 70%?  ── no ──→ practice the next weakest sub-skill
   │ yes
   ↓
Ujian Kenaikan Level (test conditions, strict bar)
   ↓
 Pass? ── no → app pinpoints the failing sub-skill → back to Targeted Practice on it
   │ yes
   ↓
Next level unlocks + rank/certificate + celebration
```

---

## 7. Engagement (subordinate to mastery, never time pressure)

Kept light and tied to _real progress_, so motivation reinforces deliberate practice
rather than competing with it.

```
🦊 Lab buddy "Hitung"   a friendly fox-in-a-lab-coat mascot: encourages, explains,
                        celebrates. Greets the kid by name.
📊 Skill Map            the star of the show — mastery meters per sub-skill, visualized
                        as a lab/skill tree the kid grows.
🏅 Rank & certificates  passing an exam earns a rank ("Asisten Lab" → "Ilmuwan Cilik" → …)
                        and a printable certificate per operation.
🔥 Streak               consecutive practice days.
🎯 Misi harian          one specific goal/day, e.g. "Naikkan penguasaan 'menyimpan' 20%".
🎉 Celebrations         confetti + mascot animation on mastery and exam passes.
```

No coins-for-cosmetics gacha loop in this version — rewards map to _mastery milestones_,
keeping the focus on getting better.

---

## 8. Tech Stack

```
Framework        Next.js 15 (App Router)
Language         TypeScript (strict)
UI Runtime       React 19
Styling          Tailwind CSS v4
State            Zustand (progress, mastery, session)
Persistence      LocalStorage (or IndexedDB if data grows)
PWA              next-pwa / Serwist (service worker + manifest + offline cache)
Animations       Framer Motion
Sound            HTML5 Audio API (preloaded + unlocked on first tap)
Icons            Lucide React
Testing          Vitest + React Testing Library + Playwright
Hosting          Vercel
```

---

## 9. Pages / Routes

```
/                              Home — mascot, streak, daily mission, operations
/operation/[id]                Skill Map — sub-skill mastery + level path + exam entry
/diagnostic/[operation]/[level]  Diagnostic assessment
/practice/[operation]/[level]    Targeted Practice (the core loop)
/exam/[operation]/[level]        Level-Up Exam (test conditions)
/review                        End-of-session mistake review
/result                        Result (practice) / exam verdict
/progress                      All operations, mastery meters, ranks, badges
```

---

## 10. Key Screens

### 10.1 Skill Map (the heart of the app)

```
┌────────────────────────────┐
│  ← Lab Tambah              │
│  🦊 "Targetmu hari ini:    │
│      menyimpan 1 angka"    │
│                            │
│  Penguasaan sub-keahlian:  │
│  Fakta dasar      ▓▓▓▓▓ 100%│
│  Tanpa simpan     ▓▓▓▓░ 85% │
│  Menyimpan 1      ▓▓░░░ 45% │ ← target
│  Menyimpan banyak ▓░░░░ 20% │
│                            │
│  [▶️ Latihan Terarah]       │
│  🔒 Ujian (butuh semua ≥70%)│
└────────────────────────────┘
```

### 10.2 Targeted Practice

```
┌────────────────────────────┐
│  Latihan: Menyimpan        │
│  Soal 3 dari 10            │
│  ████████░░░               │
│         65 + 6 =           │
│      ┌──────────┐          │
│      │    ?     │          │
│  [ custom numpad ]         │
└────────────────────────────┘

On miss → worked explanation:
  "5 + 6 = 11 → tulis 1, simpan 1. Lalu 6 + 1 = 7. Jawaban: 71."
Mastery meter for "Menyimpan" ticks up live as the kid gets them right.
```

### 10.3 Level-Up Exam

```
┌────────────────────────────┐
│  🧪 UJIAN KENAIKAN LEVEL   │
│  Level 2 · Tambah          │
│  Tanpa bantuan. Semangat!  │
│  Soal 4 dari 10            │
│         45 + 8 =           │
│      ┌──────────┐          │
│      │    ?     │          │
│  [ numpad ]                │
└────────────────────────────┘

No hints, no explanations, no re-queue. Test conditions.
```

### 10.4 Exam Verdict

```
PASS:
  🎉 LULUS! 10/10
  🦊 "Kamu resmi naik ke Level 3!"
  🏅 Rank baru: Ilmuwan Cilik
  📜 Sertifikat Tambah Level 2
  [➡️ Lanjut ke Level 3]

FAIL:
  Hampir! 7/10
  🦊 "Kamu masih goyah di: menyimpan banyak angka."
  [▶️ Latih 'menyimpan banyak'] [🔁 Coba ujian lagi nanti]
```

---

## 11. Question Generation

```typescript
function generateQuestion(
  operation: Operation,
  level: Level,
  targetSubSkill: SubSkill, // deliberate practice: drill THIS
  recentPerformance: Performance,
): Question {
  const difficulty = adaptToEdge(level, recentPerformance); // edge of ability
  const [a, b] = generateForSubSkill(
    operation,
    level,
    targetSubSkill,
    difficulty,
  );
  const answer = compute(operation, a, b);
  return { a, b, operation, level, subSkill: targetSubSkill, answer };
}
```

Generation is constrained to _produce the target sub-skill_ (e.g. force a carry),
not just a random problem in the level.

---

## 12. Scoring & Progression

```
Practice          fills mastery meters; no pass/fail
Exam pass bar     ≥ 9/10 AND ≤ 1 miss on the core sub-skill
Exam fail         routes to targeted practice on the failing sub-skill
Level unlock      only by passing the Level-Up Exam
Rank              earned per operation as exams are passed
Streak            consecutive practice days
Daily mission     one specific sub-skill goal per day
```

---

## 13. Data & Storage

LocalStorage. No account, no cloud sync.

```typescript
type SubSkillMastery = {
  subSkill: string;
  mastery: number; // 0–100
  attempts: number;
  lastPracticedAt: string;
  dueForReview?: string; // spaced repetition date
};

type LevelState = {
  unlocked: boolean;
  examPassed: boolean;
  subSkills: Record<string, SubSkillMastery>;
};

type OperationProgress = {
  rank: string; // "Asisten Lab", "Ilmuwan Cilik", ...
  levels: Record<string, LevelState>;
};

type AppProgress = {
  childName: string;
  add: OperationProgress;
  subtract: OperationProgress;
  multiply: OperationProgress;
  divide: OperationProgress;
  streak: { count: number; lastActiveDate: string };
  dailyMission: { date: string; targetSubSkill: string; done: boolean };
};
```

> Note: artifacts on Claude.ai can't use LocalStorage, but a deployed PWA on Vercel can.

---

## 14. Folder Structure

```
labmatematika/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Home
│   │   ├── progress/page.tsx
│   │   ├── operation/[id]/page.tsx           # Skill Map
│   │   ├── diagnostic/[operation]/[level]/page.tsx
│   │   ├── practice/[operation]/[level]/page.tsx
│   │   ├── exam/[operation]/[level]/page.tsx
│   │   ├── review/page.tsx
│   │   ├── result/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Mascot.tsx
│   │   ├── SkillMap.tsx                       # mastery meters per sub-skill
│   │   ├── MasteryMeter.tsx
│   │   ├── OperationCard.tsx
│   │   ├── Numpad.tsx
│   │   ├── QuestionDisplay.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── FeedbackOverlay.tsx
│   │   ├── WorkedExample.tsx
│   │   ├── ExamBanner.tsx                     # test-conditions framing
│   │   ├── ExamVerdict.tsx                    # pass/fail + routing
│   │   ├── RankBadge.tsx
│   │   ├── Certificate.tsx
│   │   ├── StreakBadge.tsx
│   │   └── Confetti.tsx
│   ├── lib/
│   │   ├── generator.ts                       # sub-skill-constrained generation
│   │   ├── subskills.ts                       # sub-skill definitions + detection
│   │   ├── mastery.ts                         # mastery meter math + readiness
│   │   ├── adaptive.ts                        # edge-of-ability difficulty
│   │   ├── diagnostic.ts                      # locate weakest sub-skill
│   │   ├── exam.ts                            # exam assembly + pass/fail rules
│   │   ├── review.ts                          # spaced repetition scheduling
│   │   ├── explain.ts                         # worked explanations (Bahasa Indonesia)
│   │   ├── strings.ts                         # all Bahasa Indonesia UI copy
│   │   ├── audio.ts
│   │   ├── storage.ts
│   │   └── constants.ts
│   ├── stores/
│   │   └── useProgressStore.ts
│   └── types/
│       └── index.ts
├── public/
│   ├── manifest.json
│   ├── icons/ (icon-192.png, icon-512.png)
│   ├── mascot/ (idle, happy, sad, celebrate, labcoat)
│   └── sounds/ (correct.mp3, wrong.mp3, levelup.mp3, exam-pass.mp3)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## 15. UX Principles for Young Kids

```
Large font / buttons    ≥ 28px questions, ≥ 56px numpad targets
Bright colors           each operation has its own lab/world color
Instant feedback        no loading, no delay
No timer                accuracy & mastery over speed
Encouraging tone        warm Bahasa Indonesia, never punishing
Mistakes = learning     every miss shows the method, framed kindly
Mastery made visible    meters and the Skill Map make progress concrete
No ads, no IAP          fully offline, family-safe
Portrait lock           designed for a phone held upright
```

### Color per Operation

```
Tambah Blue #3B82F6 · Kurang Red #EF4444 · Kali Green #22C55E · Bagi Amber #EAB308
```

---

## 16. Out of Scope

```
❌ Login / accounts            ❌ Leaderboards / multiplayer
❌ Server-side question bank    ❌ Real-money purchases
❌ Fractions / decimals         ❌ Timed / time-pressure modes
❌ App store submission (PWA)   ❌ Multiple profiles (name only, single profile)
```

---

## 17. Bahasa Indonesia UI Strings (reference)

Centralize in `lib/strings.ts`.

```
Beranda                       Home
Lab Tambah/Kurang/Kali/Bagi   Add/Subtract/Multiply/Divide lab
Peta Keahlian                 Skill Map
Penguasaan                    Mastery
Belum dikuasai / Sedang dilatih / Dikuasai
Diagnostik                    Diagnostic
Latihan Terarah               Targeted Practice
Ujian Kenaikan Level          Level-Up Exam
Tanpa bantuan. Semangat!      No help. You got this!
Targetmu hari ini: …          Today's target: …
Soal {n} dari 10              Question n of 10
Benar! / Belum tepat          Correct! / Not quite
Lihat caranya                 Show me how
LULUS! / Hampir!              PASSED! / Almost!
Kamu naik ke Level {n}!       You've reached Level n!
Rank baru: …                  New rank: …
Sertifikat …                  Certificate …
Perlu dikuatkan: …            Needs strengthening: …
Runtutan {n} hari             n-day streak
Misi harian                   Daily mission
Ulangi / Lanjut / Beranda     Retry / Next / Home
```

Mascot lines: "Halo, {nama}! Siap latihan?", "Keren, penguasaanmu naik!",
"Hampir benar — fokus ke satuannya ya.", "Kamu LULUS! Bangga banget! 🎉"
Rank ladder: Asisten Lab → Ilmuwan Cilik → Ahli Hitung → Profesor Matematika.

---

## 18. Build Order

```
Phase 1 — Deliberate practice core
  Next.js + TS + Tailwind setup
  Sub-skill definitions + sub-skill-constrained generator
  Targeted Practice loop + custom numpad
  Immediate worked-explanation feedback
  Mastery meters (mastery.ts) + Skill Map

Phase 2 — Diagnose & gate
  Diagnostic assessment (locate weakest sub-skill)
  Adaptive edge-of-ability difficulty
  Level-Up Exam (test conditions + strict pass bar)
  Exam verdict + fail-routing to the failing sub-skill
  Rank + certificate on pass

Phase 3 — Retention & engagement
  Spaced review scheduling
  Mascot (poses + speech) on every screen
  Daily mission (sub-skill targeted) + streak
  Confetti + sound + Framer Motion celebrations

Phase 4 — PWA + polish
  manifest.json + service worker (next-pwa / Serwist)
  Offline caching + install-to-home-screen
  iOS audio unlock + install hint
  LocalStorage persistence
  Cross-device QA (Android Chrome + iOS Safari)
```
