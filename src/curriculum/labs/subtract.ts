import { Level } from '../types';
import { randInt, scale } from '../rng';

// Lab Kurang — subtraction ladder (see specs §7). Results are always ≥ 0.
export const subLevels: Level[] = [
  {
    id: 'sub.within10',
    lab: 'sub',
    tingkat: 1,
    urutan: 1,
    labelId: 'Fakta dasar dalam 10',
    tipe: 'fakta',
    isCore: true,
    prereqs: [],
    explainId: 'sub.within10',
    generate: (diff) => {
      const a = randInt(3, scale(diff, 6, 10));
      const b = randInt(1, a - 1);
      return [a, b];
    },
  },
  {
    id: 'sub.bridge10',
    lab: 'sub',
    tingkat: 1,
    urutan: 2,
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
    id: 'sub.2d.noborrow',
    lab: 'sub',
    tingkat: 2,
    urutan: 1,
    labelId: 'Dua angka tanpa meminjam',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['sub.within10', 'sub.bridge10'],
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
    id: 'sub.multi.borrow',
    lab: 'sub',
    tingkat: 3,
    urutan: 1,
    labelId: 'Multi-digit meminjam',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['sub.2d.borrow'],
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
    urutan: 2,
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
];
