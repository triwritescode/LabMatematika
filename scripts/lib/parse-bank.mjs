// Shared CSV → bank parser, used by build-question-bank.mjs (emits the bundled
// bank.data.ts) and seed-questions.mjs (upserts the Supabase `questions` table),
// so both stay in lockstep with the CSV taxonomy.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// LAB (Bahasa) → Operation + level-id prefix.
const LAB_TO_OP = {
  PENJUMLAHAN: 'add',
  PENGURANGAN: 'sub',
  PERKALIAN: 'mul',
  PEMBAGIAN: 'div',
};

const DIFFICULTY = { Mudah: 'mudah', Sedang: 'sedang', Sulit: 'sulit' };

// Minimal RFC-4180 CSV parser (handles quotes, embedded commas + newlines).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    } else field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function slug(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse all curriculum/*.csv into levels + questions.
 * `questions` carry the level meta (tingkat/skill/urutan) too, so the seed
 * script can populate the remote table; bank.data.ts only keeps the runtime
 * subset (see build-question-bank.mjs).
 */
export function buildBank(csvDir) {
  const questions = [];
  const levels = [];
  const levelById = new Map();

  const files = readdirSync(csvDir)
    .filter((f) => f.toLowerCase().endsWith('.csv'))
    .sort();

  for (const file of files) {
    const rows = parseCsv(readFileSync(join(csvDir, file), 'utf8'));
    const headerIdx = rows.findIndex((r) => r.includes('CODE'));
    if (headerIdx < 0) throw new Error(`No header row in ${file}`);
    const header = rows[headerIdx].map((h) => h.trim());
    const col = (name) => {
      const idx = header.indexOf(name);
      if (idx < 0) throw new Error(`Missing column ${name} in ${file}`);
      return idx;
    };
    const ci = {
      code: col('CODE'),
      lab: col('LAB'),
      level: col('LEVEL'),
      skill: col('SKILL'),
      question: col('QUESTION'),
      answer: col('ANSWER'),
      difficulty: col('DIFFICULTY'),
      explanation: col('EXPLANATION'),
    };

    const urutanByTingkat = new Map();

    for (const r of rows.slice(headerIdx + 1)) {
      if (!r[ci.code] || !r[ci.code].trim()) continue; // skip blank/spacer rows
      const labName = r[ci.lab].trim();
      const op = LAB_TO_OP[labName];
      if (!op) throw new Error(`Unknown LAB "${labName}" in ${file}`);
      const tingkat = Number(r[ci.level].trim());
      const skill = r[ci.skill].trim();
      const prompt = r[ci.question].trim();
      const difficulty = DIFFICULTY[r[ci.difficulty].trim()];
      if (!difficulty) throw new Error(`Unknown DIFFICULTY "${r[ci.difficulty]}" in ${file}`);
      const answer = Number(r[ci.answer].trim());
      if (!Number.isFinite(answer)) throw new Error(`Bad ANSWER "${r[ci.answer]}" for ${r[ci.code]}`);

      const levelId = `${op}.${slug(skill)}`;
      if (!levelById.has(levelId)) {
        const urutan = (urutanByTingkat.get(tingkat) ?? 0) + 1;
        urutanByTingkat.set(tingkat, urutan);
        const prev = levels.filter((l) => l.lab === op && l.tingkat === tingkat).slice(-1)[0];
        const level = {
          id: levelId,
          lab: op,
          tingkat,
          urutan,
          labelId: skill,
          tipe: 'fakta',
          isCore: true,
          prereqs: prev ? [prev.id] : [],
        };
        levelById.set(levelId, level);
        levels.push(level);
      }

      questions.push({
        code: r[ci.code].trim(),
        levelId,
        lab: op,
        tingkat,
        skill,
        urutan: levelById.get(levelId).urutan,
        prompt,
        answer,
        difficulty,
        explanation: r[ci.explanation].trim(),
      });
    }
  }

  return { levels, questions };
}
