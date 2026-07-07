import { Level } from '../types';
import { pick, randInt, scale } from '../rng';

// Lab Tambah — addition ladder (see specs §7).
//
// Four tingkat, grade 1 → 6 progression. Tingkat 1 builds number sense and
// mental strategies (bonds, doubles, make-ten, whole tens) BEFORE any column
// work; the strategy levels are what actually grow arithmetic fluency, not just
// bigger numbers. Tingkat 2–4 climb the standard column algorithm to large
// numbers with carry chains. Every level is two whole-number operands with an
// exact sum, matching the question engine.
export const addLevels: Level[] = [
  // ── Tingkat 1 · Fakta & strategi mental ─────────────────────────────────
  {
    id: 'add.within5',
    lab: 'add',
    tingkat: 1,
    urutan: 1,
    labelId: 'Pasangan dalam 5',
    tipe: 'fakta',
    isCore: false,
    prereqs: [],
    explainId: 'add.within10',
    // number bonds to 5 — the very first facts (early grade 1)
    generate: (diff) => {
      const sum = randInt(2, scale(diff, 4, 5));
      const a = randInt(1, sum - 1);
      return [a, sum - a];
    },
  },
  {
    id: 'add.within10',
    lab: 'add',
    tingkat: 1,
    urutan: 2,
    labelId: 'Fakta dasar dalam 10',
    tipe: 'fakta',
    isCore: true,
    prereqs: ['add.within5'],
    explainId: 'add.within10',
    // a + b ≤ 10; diff pushes the sum toward 10
    generate: (diff) => {
      const targetSum = scale(diff, 5, 10);
      const sum = randInt(Math.max(3, targetSum - 2), targetSum);
      const a = randInt(1, sum - 1);
      return [a, sum - a];
    },
  },
  {
    id: 'add.doubles',
    lab: 'add',
    tingkat: 1,
    urutan: 3,
    labelId: 'Dobel & dekat-dobel',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['add.within10'],
    explainId: 'add.doubles',
    // doubles (6+6) and near-doubles (6+7) — a keystone mental strategy
    generate: (diff) => {
      const base = randInt(2, scale(diff, 5, 9));
      const offset = pick([0, 0, 1, -1]); // bias toward the exact double
      return [base, base + offset];
    },
  },
  {
    id: 'add.bridge10',
    lab: 'add',
    tingkat: 1,
    urutan: 4,
    labelId: 'Menjembatani 10',
    tipe: 'fakta',
    isCore: true,
    prereqs: ['add.within10'],
    explainId: 'add.bridge10',
    // single digits crossing ten: sum 11..18
    generate: (diff) => {
      const sum = randInt(11, scale(diff, 12, 18));
      const a = randInt(Math.max(2, sum - 9), 9);
      return [a, sum - a];
    },
  },
  {
    id: 'add.tens',
    lab: 'add',
    tingkat: 1,
    urutan: 5,
    labelId: 'Menjumlah puluhan',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['add.within10'],
    explainId: 'add.tens',
    // whole tens: 30 + 50 — place-value reuse of the basic facts
    generate: (diff) => {
      const t1 = randInt(1, scale(diff, 5, 9));
      const t2 = randInt(1, scale(diff, 4, 9));
      return [t1 * 10, t2 * 10];
    },
  },

  // ── Tingkat 2 · Dua angka ────────────────────────────────────────────────
  {
    id: 'add.2d.nocarry',
    lab: 'add',
    tingkat: 2,
    urutan: 1,
    labelId: 'Dua angka tanpa menyimpan',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['add.bridge10', 'add.tens'],
    explainId: 'add.column.nocarry',
    // ones digits sum ≤ 9, tens digits sum ≤ 9
    generate: (diff) => {
      const tensMax = scale(diff, 5, 8);
      const t1 = randInt(1, tensMax);
      const t2 = randInt(1, 9 - t1);
      const o1 = randInt(0, 9);
      const o2 = randInt(0, 9 - o1);
      return [t1 * 10 + o1, t2 * 10 + o2];
    },
  },
  {
    id: 'add.2d.carry',
    lab: 'add',
    tingkat: 2,
    urutan: 2,
    labelId: 'Menyimpan',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['add.2d.nocarry'],
    explainId: 'add.column.carry',
    // ones digits must carry: o1 + o2 ≥ 10
    generate: (diff) => {
      const o1 = randInt(2, 9);
      const o2 = randInt(10 - o1, 9);
      const tensMax = scale(diff, 4, 9);
      const t1 = randInt(1, tensMax);
      const t2 = randInt(1, tensMax);
      return [t1 * 10 + o1, t2 * 10 + o2];
    },
  },
  {
    id: 'add.compensate',
    lab: 'add',
    tingkat: 2,
    urutan: 3,
    labelId: 'Strategi kompensasi',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['add.2d.carry'],
    explainId: 'add.compensate',
    // one addend sits just below a ten (…8/…9) → round-and-adjust mentally
    generate: (diff) => {
      const near = randInt(2, scale(diff, 5, 9)) * 10 - pick([1, 2]);
      const other = randInt(13, scale(diff, 38, 79));
      return [near, other];
    },
  },

  // ── Tingkat 3 · Tiga angka ───────────────────────────────────────────────
  {
    id: 'add.3d.nocarry',
    lab: 'add',
    tingkat: 3,
    urutan: 1,
    labelId: 'Tiga angka tanpa menyimpan',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['add.2d.carry'],
    explainId: 'add.column.nocarry',
    // every column pair sums ≤ 9
    generate: (diff) => {
      const o1 = randInt(0, 9);
      const o2 = randInt(0, 9 - o1);
      const t1 = randInt(0, 9);
      const t2 = randInt(0, 9 - t1);
      const h1 = randInt(1, scale(diff, 4, 8));
      const h2 = randInt(1, Math.max(1, 9 - h1));
      return [h1 * 100 + t1 * 10 + o1, h2 * 100 + t2 * 10 + o2];
    },
  },
  {
    id: 'add.3d.carry',
    lab: 'add',
    tingkat: 3,
    urutan: 2,
    labelId: 'Tiga angka menyimpan',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['add.3d.nocarry'],
    explainId: 'add.column.carry',
    // guaranteed carry in the ones
    generate: (diff) => {
      const o1 = randInt(2, 9);
      const o2 = randInt(10 - o1, 9);
      const t1 = randInt(1, 9);
      const t2 = randInt(1, 9);
      const h1 = randInt(1, scale(diff, 4, 8));
      const h2 = randInt(1, scale(diff, 4, 8));
      return [h1 * 100 + t1 * 10 + o1, h2 * 100 + t2 * 10 + o2];
    },
  },
  {
    id: 'add.3d.chain',
    lab: 'add',
    tingkat: 3,
    urutan: 3,
    labelId: 'Menyimpan berantai',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['add.3d.carry'],
    explainId: 'add.column.carry',
    // ones AND tens both carry — the hardest 3-digit case (e.g. 168 + 275)
    generate: (diff) => {
      const o1 = randInt(2, 9);
      const o2 = randInt(10 - o1, 9);
      const t1 = randInt(2, 9);
      const t2 = randInt(10 - t1, 9);
      const h1 = randInt(1, scale(diff, 5, 9));
      const h2 = randInt(1, scale(diff, 5, 9));
      return [h1 * 100 + t1 * 10 + o1, h2 * 100 + t2 * 10 + o2];
    },
  },

  // ── Tingkat 4 · Angka besar ──────────────────────────────────────────────
  {
    id: 'add.multi.carry',
    lab: 'add',
    tingkat: 4,
    urutan: 1,
    labelId: 'Multi-digit menyimpan',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['add.3d.carry'],
    explainId: 'add.column.carry',
    // 3-digit (diff grows toward 4-digit) with a guaranteed carry in the ones
    generate: (diff) => {
      const hi = scale(diff, 999, 9999);
      const o1 = randInt(2, 9);
      const o2 = randInt(10 - o1, 9);
      const a = randInt(10, Math.floor(hi / 10)) * 10 + o1;
      const b = randInt(10, Math.floor(hi / 10)) * 10 + o2;
      return [a, b];
    },
  },
  {
    id: 'add.thousands',
    lab: 'add',
    tingkat: 4,
    urutan: 2,
    labelId: 'Ribuan & puluh ribuan',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['add.multi.carry'],
    explainId: 'add.column.carry',
    // 4–5 digit sums with a guaranteed carry — full column stamina
    generate: (diff) => {
      const hi = scale(diff, 9999, 99999);
      const o1 = randInt(2, 9);
      const o2 = randInt(10 - o1, 9);
      const a = randInt(100, Math.floor(hi / 10)) * 10 + o1;
      const b = randInt(100, Math.floor(hi / 10)) * 10 + o2;
      return [a, b];
    },
  },
];
