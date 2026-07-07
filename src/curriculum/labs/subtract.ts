import { Level } from '../types';
import { pick, randInt, scale } from '../rng';

// Lab Kurang — subtraction ladder (see specs §7). Results are always ≥ 0.
//
// Four tingkat, grade 1 → 6. Tingkat 1 pairs the take-away facts with the two
// mental engines of subtraction — counting UP to find a difference, and the
// make-ten bridge — plus whole-tens place value. Tingkat 2–4 climb the column
// (borrow) algorithm: two-digit, three-digit, borrowing across zeros, and large
// numbers. Every level is two whole operands with an exact non-negative result.
export const subLevels: Level[] = [
  // ── Tingkat 1 · Fakta & strategi mental ─────────────────────────────────
  {
    id: 'sub.within5',
    lab: 'sub',
    tingkat: 1,
    urutan: 1,
    labelId: 'Ambil dalam 5',
    tipe: 'fakta',
    isCore: false,
    prereqs: [],
    explainId: 'sub.within10',
    generate: (diff) => {
      const a = randInt(2, scale(diff, 4, 5));
      const b = randInt(1, a - 1);
      return [a, b];
    },
  },
  {
    id: 'sub.within10',
    lab: 'sub',
    tingkat: 1,
    urutan: 2,
    labelId: 'Fakta dasar dalam 10',
    tipe: 'fakta',
    isCore: true,
    prereqs: ['sub.within5'],
    explainId: 'sub.within10',
    generate: (diff) => {
      const a = randInt(3, scale(diff, 6, 10));
      const b = randInt(1, a - 1);
      return [a, b];
    },
  },
  {
    id: 'sub.countup',
    lab: 'sub',
    tingkat: 1,
    urutan: 3,
    labelId: 'Hitung maju',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['sub.within10'],
    explainId: 'sub.countup',
    // small difference across ten (13 − 8): fastest solved by counting UP
    generate: (diff) => {
      const a = randInt(11, scale(diff, 13, 17));
      const b = randInt(a - 6, a - 1); // difference 1..6
      return [a, b];
    },
  },
  {
    id: 'sub.bridge10',
    lab: 'sub',
    tingkat: 1,
    urutan: 4,
    labelId: 'Menjembatani 10',
    tipe: 'fakta',
    isCore: true,
    prereqs: ['sub.within10'],
    explainId: 'sub.bridge10',
    // minuend 11..18, subtrahend crosses ten (result < 10)
    generate: (diff) => {
      const a = randInt(11, scale(diff, 13, 18));
      const b = randInt(a - 9, 9); // forces a − b < 10 with single-digit b
      return [a, b];
    },
  },
  {
    id: 'sub.tens',
    lab: 'sub',
    tingkat: 1,
    urutan: 5,
    labelId: 'Kurang puluhan',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['sub.within10'],
    explainId: 'sub.tens',
    // whole tens: 80 − 30 — place-value reuse of the basic facts
    generate: (diff) => {
      const tA = randInt(2, scale(diff, 6, 9));
      const tB = randInt(1, tA - 1);
      return [tA * 10, tB * 10];
    },
  },

  // ── Tingkat 2 · Dua angka ────────────────────────────────────────────────
  {
    id: 'sub.2d.noborrow',
    lab: 'sub',
    tingkat: 2,
    urutan: 1,
    labelId: 'Dua angka tanpa meminjam',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['sub.bridge10', 'sub.tens'],
    explainId: 'sub.column.noborrow',
    // ones of a ≥ ones of b, tens of a > tens of b
    generate: (diff) => {
      const tA = randInt(2, scale(diff, 5, 9));
      const tB = randInt(1, tA - 1);
      const oA = randInt(1, 9);
      const oB = randInt(0, oA);
      return [tA * 10 + oA, tB * 10 + oB];
    },
  },
  {
    id: 'sub.2d.borrow',
    lab: 'sub',
    tingkat: 2,
    urutan: 2,
    labelId: 'Meminjam',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['sub.2d.noborrow'],
    explainId: 'sub.column.borrow',
    // ones of a < ones of b → must borrow
    generate: (diff) => {
      const oA = randInt(0, 8);
      const oB = randInt(oA + 1, 9);
      const tA = randInt(2, scale(diff, 5, 9));
      const tB = randInt(1, tA - 1);
      return [tA * 10 + oA, tB * 10 + oB];
    },
  },
  {
    id: 'sub.compensate',
    lab: 'sub',
    tingkat: 2,
    urutan: 3,
    labelId: 'Strategi kompensasi',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['sub.2d.borrow'],
    explainId: 'sub.compensate',
    // subtrahend just below a ten (…8/…9): subtract the round ten, add back
    generate: (diff) => {
      const b = randInt(2, scale(diff, 5, 9)) * 10 - pick([1, 2]);
      const a = b + randInt(11, scale(diff, 29, 69));
      return [a, b];
    },
  },

  // ── Tingkat 3 · Tiga angka ───────────────────────────────────────────────
  {
    id: 'sub.3d.noborrow',
    lab: 'sub',
    tingkat: 3,
    urutan: 1,
    labelId: 'Tiga angka tanpa meminjam',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['sub.2d.borrow'],
    explainId: 'sub.column.noborrow',
    // every column of a ≥ matching column of b
    generate: (diff) => {
      const oB = randInt(0, 9);
      const oA = randInt(oB, 9);
      const tB = randInt(0, 9);
      const tA = randInt(tB, 9);
      const hB = randInt(1, scale(diff, 4, 7));
      const hA = randInt(hB, 9);
      return [hA * 100 + tA * 10 + oA, hB * 100 + tB * 10 + oB];
    },
  },
  {
    id: 'sub.multi.borrow',
    lab: 'sub',
    tingkat: 3,
    urutan: 2,
    labelId: 'Tiga angka meminjam',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['sub.3d.noborrow'],
    explainId: 'sub.column.borrow',
    // 3-digit with a borrow in the ones; avoid zero tens (that is the next level)
    generate: (diff) => {
      const oA = randInt(0, 8);
      const oB = randInt(oA + 1, 9);
      const tA = randInt(1, 9);
      const tB = randInt(1, 9);
      const hMax = scale(diff, 5, 9);
      const hA = randInt(2, hMax);
      const hB = randInt(1, hA - 1);
      return [hA * 100 + tA * 10 + oA, hB * 100 + tB * 10 + oB];
    },
  },
  {
    id: 'sub.borrow.zero',
    lab: 'sub',
    tingkat: 3,
    urutan: 3,
    labelId: 'Meminjam lewat nol',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['sub.multi.borrow'],
    explainId: 'sub.borrow.zero',
    // minuend has 0 in the tens and needs a borrow, e.g. 305 − 127
    generate: (diff) => {
      const oA = randInt(0, 8);
      const oB = randInt(oA + 1, 9);
      const hMax = scale(diff, 4, 9);
      const hA = randInt(2, hMax);
      const hB = randInt(1, hA - 1);
      const tB = randInt(0, 9);
      const a = hA * 100 + 0 * 10 + oA;
      const b = hB * 100 + tB * 10 + oB;
      return a > b ? [a, b] : [a + 100, b];
    },
  },

  // ── Tingkat 4 · Angka besar ──────────────────────────────────────────────
  {
    id: 'sub.thousands',
    lab: 'sub',
    tingkat: 4,
    urutan: 1,
    labelId: 'Ribuan meminjam',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['sub.multi.borrow'],
    explainId: 'sub.column.borrow',
    // 4–5 digit with a guaranteed ones borrow; a > b by construction
    generate: (diff) => {
      const oA = randInt(0, 8);
      const oB = randInt(oA + 1, 9);
      const restHi = scale(diff, 999, 9999);
      const rA = randInt(200, restHi);
      const rB = randInt(100, rA - 1);
      return [rA * 10 + oA, rB * 10 + oB];
    },
  },
  {
    id: 'sub.across.zeros',
    lab: 'sub',
    tingkat: 4,
    urutan: 2,
    labelId: 'Meminjam lewat banyak nol',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['sub.thousands'],
    explainId: 'sub.borrow.zero',
    // round thousands minuend (4000 − 1687): borrow chains across several zeros
    generate: (diff) => {
      const a = randInt(2, scale(diff, 9, 99)) * 1000;
      const b = randInt(101, a - 1);
      return [a, b];
    },
  },
];
