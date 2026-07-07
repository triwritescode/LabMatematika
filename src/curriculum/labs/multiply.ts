import { Level } from '../types';
import { pick, randInt, scale } from '../rng';

// Lab Kali — multiplication ladder (see specs §7).
//
// Four tingkat, grade 2 → 6. Tingkat 1 is meaning + times tables. Tingkat 2 is
// the mental leverage that makes big multiplication tractable — ×10/×100,
// multiples of ten, and the distributive break-apart (7 × 13 = 7×10 + 7×3),
// which is literally the column algorithm in disguise. Tingkat 3–4 formalise it
// into written multiplication up to large numbers.
export const mulLevels: Level[] = [
  // ── Tingkat 1 · Konsep & tabel ───────────────────────────────────────────
  {
    id: 'mul.concept',
    lab: 'mul',
    tingkat: 1,
    urutan: 1,
    labelId: 'Perkalian = penjumlahan berulang',
    tipe: 'konsep',
    isCore: false,
    prereqs: [],
    explainId: 'mul.concept',
    generate: (diff) => {
      const a = randInt(2, scale(diff, 3, 5));
      const b = randInt(2, scale(diff, 3, 5));
      return [a, b];
    },
  },
  {
    id: 'mul.table.easy',
    lab: 'mul',
    tingkat: 1,
    urutan: 2,
    labelId: 'Tabel 2, 5, 10',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['mul.concept'],
    explainId: 'mul.table',
    generate: (diff) => [randInt(2, scale(diff, 5, 10)), pick([2, 5, 10])],
  },
  {
    id: 'mul.table.mid',
    lab: 'mul',
    tingkat: 1,
    urutan: 3,
    labelId: 'Tabel 3, 4',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['mul.table.easy'],
    explainId: 'mul.table',
    generate: (diff) => [randInt(2, scale(diff, 5, 10)), pick([3, 4])],
  },
  {
    id: 'mul.table.hard',
    lab: 'mul',
    tingkat: 1,
    urutan: 4,
    labelId: 'Tabel 6, 7, 8, 9',
    tipe: 'fakta',
    isCore: true,
    prereqs: ['mul.table.mid'],
    explainId: 'mul.table',
    generate: (diff) => [randInt(2, scale(diff, 5, 10)), pick([6, 7, 8, 9])],
  },

  // ── Tingkat 2 · Kelipatan & strategi mental ─────────────────────────────
  {
    id: 'mul.by10',
    lab: 'mul',
    tingkat: 2,
    urutan: 1,
    labelId: 'Kali 10 dan 100',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['mul.table.hard'],
    explainId: 'mul.by10',
    generate: (diff) => [randInt(2, scale(diff, 20, 99)), pick([10, 100])],
  },
  {
    id: 'mul.tens',
    lab: 'mul',
    tingkat: 2,
    urutan: 2,
    labelId: 'Kali kelipatan puluhan',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['mul.by10'],
    explainId: 'mul.tens',
    // 6 × 30 — a known fact times ten
    generate: (diff) => [randInt(2, 9), randInt(2, scale(diff, 5, 9)) * 10],
  },
  {
    id: 'mul.distribute',
    lab: 'mul',
    tingkat: 2,
    urutan: 3,
    labelId: 'Sifat distributif',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['mul.tens'],
    explainId: 'mul.column.2d',
    // 1-digit × 2-digit broken by place value: 7 × 13 = 7×10 + 7×3
    generate: (diff) => [randInt(3, 9), randInt(11, scale(diff, 19, 29))],
  },

  // ── Tingkat 3 · Perkalian bersusun ───────────────────────────────────────
  {
    id: 'mul.2d.1d',
    lab: 'mul',
    tingkat: 3,
    urutan: 1,
    labelId: '2–3 angka × 1 angka',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['mul.distribute'],
    explainId: 'mul.column.1d',
    generate: (diff) => [randInt(12, scale(diff, 49, 999)), randInt(2, 9)],
  },
  {
    id: 'mul.2d.2d',
    lab: 'mul',
    tingkat: 3,
    urutan: 2,
    labelId: '2 angka × 2 angka',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['mul.2d.1d'],
    explainId: 'mul.column.2d',
    generate: (diff) => [randInt(11, scale(diff, 39, 99)), randInt(11, scale(diff, 29, 99))],
  },
  {
    id: 'mul.3d.2d',
    lab: 'mul',
    tingkat: 3,
    urutan: 3,
    labelId: '3 angka × 2 angka',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['mul.2d.2d'],
    explainId: 'mul.column.2d',
    generate: (diff) => [randInt(101, scale(diff, 299, 999)), randInt(11, scale(diff, 29, 99))],
  },

  // ── Tingkat 4 · Angka besar ──────────────────────────────────────────────
  {
    id: 'mul.multi',
    lab: 'mul',
    tingkat: 4,
    urutan: 1,
    labelId: 'Multi-digit',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['mul.3d.2d'],
    explainId: 'mul.column.2d',
    generate: (diff) => [randInt(101, scale(diff, 399, 999)), randInt(11, scale(diff, 29, 99))],
  },
  {
    id: 'mul.large',
    lab: 'mul',
    tingkat: 4,
    urutan: 2,
    labelId: 'Angka ribuan',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['mul.multi'],
    explainId: 'mul.column.2d',
    generate: (diff) => [randInt(1001, scale(diff, 4999, 9999)), randInt(11, scale(diff, 29, 99))],
  },
];
