import { Level } from '../types';
import { randInt, scale } from '../rng';

// Lab Tambah — addition ladder (see specs §7).
export const addLevels: Level[] = [
  {
    id: 'add.within10',
    lab: 'add',
    tingkat: 1,
    urutan: 1,
    labelId: 'Fakta dasar dalam 10',
    tipe: 'fakta',
    isCore: true,
    prereqs: [],
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
    id: 'add.bridge10',
    lab: 'add',
    tingkat: 1,
    urutan: 2,
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
    id: 'add.2d.nocarry',
    lab: 'add',
    tingkat: 2,
    urutan: 1,
    labelId: 'Dua angka tanpa menyimpan',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['add.within10', 'add.bridge10'],
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
    id: 'add.multi.carry',
    lab: 'add',
    tingkat: 3,
    urutan: 1,
    labelId: 'Multi-digit menyimpan',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['add.2d.carry'],
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
];
