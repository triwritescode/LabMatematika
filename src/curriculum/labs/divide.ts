import { Level } from '../types';
import { randInt, scale } from '../rng';

// Lab Bagi — division ladder (see specs §7). Whole-number results only (v1).
export const divLevels: Level[] = [
  {
    id: 'div.facts',
    lab: 'div',
    tingkat: 1,
    urutan: 1,
    labelId: 'Fakta bagi (kebalikan tabel)',
    tipe: 'fakta',
    isCore: true,
    prereqs: [],
    explainId: 'div.facts',
    generate: (diff) => {
      const b = randInt(2, scale(diff, 5, 9));
      const q = randInt(2, scale(diff, 5, 9));
      return [b * q, b];
    },
  },
  {
    id: 'div.2d.1d',
    lab: 'div',
    tingkat: 1,
    urutan: 2,
    labelId: '2–3 angka ÷ 1 angka',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['div.facts'],
    explainId: 'div.short',
    generate: (diff) => {
      const b = randInt(2, 9);
      const q = randInt(11, scale(diff, 25, Math.floor(999 / b)));
      return [b * q, b];
    },
  },
  {
    id: 'div.long',
    lab: 'div',
    tingkat: 2,
    urutan: 1,
    labelId: 'Pembagian panjang (pembagi 2 angka)',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['div.2d.1d'],
    explainId: 'div.long',
    generate: (diff) => {
      const b = randInt(11, scale(diff, 19, 49));
      const q = randInt(3, scale(diff, 9, 99));
      return [b * q, b];
    },
  },
  {
    id: 'div.large',
    lab: 'div',
    tingkat: 2,
    urutan: 2,
    labelId: 'Angka besar',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['div.long'],
    explainId: 'div.long',
    generate: (diff) => {
      const b = randInt(12, scale(diff, 29, 99));
      const q = randInt(21, scale(diff, 59, 999));
      return [b * q, b];
    },
  },
];
