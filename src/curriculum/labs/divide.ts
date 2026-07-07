import { Level } from '../types';
import { pick, randInt, scale } from '../rng';

// Lab Bagi — division ladder (see specs §7). Whole-number results only (v1).
//
// Four tingkat, grade 3 → 6. Tingkat 1 grounds division as fair-sharing / the
// inverse of the times tables, plus the ÷10 shortcut. Tingkat 2 is short
// division by a single digit; Tingkat 3 is long division by a two-digit
// divisor; Tingkat 4 pushes to large dividends and the ÷(multiple of ten)
// shortcut. Every question divides evenly — no remainders in v1.
export const divLevels: Level[] = [
  // ── Tingkat 1 · Fakta & konsep ───────────────────────────────────────────
  {
    id: 'div.concept',
    lab: 'div',
    tingkat: 1,
    urutan: 1,
    labelId: 'Bagi = berbagi rata',
    tipe: 'konsep',
    isCore: false,
    prereqs: [],
    explainId: 'div.concept',
    generate: (diff) => {
      const b = randInt(2, scale(diff, 4, 6));
      const q = randInt(2, scale(diff, 4, 6));
      return [b * q, b];
    },
  },
  {
    id: 'div.facts',
    lab: 'div',
    tingkat: 1,
    urutan: 2,
    labelId: 'Fakta bagi (kebalikan tabel)',
    tipe: 'fakta',
    isCore: true,
    prereqs: ['div.concept'],
    explainId: 'div.facts',
    generate: (diff) => {
      const b = randInt(2, scale(diff, 5, 9));
      const q = randInt(2, scale(diff, 5, 9));
      return [b * q, b];
    },
  },
  {
    id: 'div.by10',
    lab: 'div',
    tingkat: 1,
    urutan: 3,
    labelId: 'Bagi 10 dan 100',
    tipe: 'fakta',
    isCore: false,
    prereqs: ['div.facts'],
    explainId: 'div.by10',
    generate: (diff) => {
      const d = pick([10, 100]);
      const q = randInt(2, scale(diff, 20, 99));
      return [q * d, d];
    },
  },

  // ── Tingkat 2 · Pembagi 1 angka ──────────────────────────────────────────
  {
    id: 'div.2d.1d',
    lab: 'div',
    tingkat: 2,
    urutan: 1,
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
    id: 'div.4d.1d',
    lab: 'div',
    tingkat: 2,
    urutan: 2,
    labelId: '4 angka ÷ 1 angka',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['div.2d.1d'],
    explainId: 'div.short',
    generate: (diff) => {
      const b = randInt(2, 9);
      const q = randInt(101, scale(diff, 499, Math.floor(9999 / b)));
      return [b * q, b];
    },
  },

  // ── Tingkat 3 · Pembagian panjang (pembagi 2 angka) ──────────────────────
  {
    id: 'div.long',
    lab: 'div',
    tingkat: 3,
    urutan: 1,
    labelId: 'Pembagian panjang (pembagi 2 angka)',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['div.4d.1d'],
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
    tingkat: 3,
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

  // ── Tingkat 4 · Angka besar & jalan pintas ───────────────────────────────
  {
    id: 'div.huge',
    lab: 'div',
    tingkat: 4,
    urutan: 1,
    labelId: 'Puluh ribuan ÷ 2 angka',
    tipe: 'algoritma',
    isCore: true,
    prereqs: ['div.large'],
    explainId: 'div.long',
    generate: (diff) => {
      const b = randInt(12, scale(diff, 29, 99));
      const q = randInt(101, scale(diff, 999, 9999));
      return [b * q, b];
    },
  },
  {
    id: 'div.by.tens',
    lab: 'div',
    tingkat: 4,
    urutan: 2,
    labelId: 'Bagi kelipatan puluhan',
    tipe: 'algoritma',
    isCore: false,
    prereqs: ['div.large'],
    explainId: 'div.by.tens',
    // ÷ (multiple of ten): drop a zero, then divide by the unit
    generate: (diff) => {
      const k = randInt(2, scale(diff, 5, 9));
      const b = k * 10;
      const q = randInt(11, scale(diff, 49, 499));
      return [b * q, b];
    },
  },
];
