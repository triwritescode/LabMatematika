#!/usr/bin/env node
// One-time (re-runnable) upload of the CSV question bank into the Supabase
// `questions` table. Idempotent: upserts by `code`. Run after editing the CSVs
// so remote clients pull the updates (see src/curriculum/bank.ts).
//
// `pnpm seed:questions` auto-loads .env.local (Node --env-file-if-exists). Put
// the service-role key there (bypasses RLS — the table is client-read-only):
//   SUPABASE_SERVICE_ROLE_KEY=...   (SUPABASE_URL falls back to the public URL)
//
// SECURITY: never commit the service-role key or run this from the app.

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

import { buildBank } from './lib/parse-bank.mjs';

const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    'Missing env. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (SUPABASE_URL ' +
      'defaults to EXPO_PUBLIC_SUPABASE_URL). See .env.example.'
  );
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { questions } = buildBank(join(root, 'curriculum'));

const rows = questions.map((q) => ({
  code: q.code,
  skill_id: q.skillId,
  lab: q.lab,
  level: q.level,
  skill: q.skill,
  ordinal: q.ordinal,
  prompt: q.prompt,
  answer: q.answer,
  difficulty: q.difficulty,
  explanation: q.explanation,
  deleted: false,
  updated_at: new Date().toISOString(),
}));

const supabase = createClient(url, key, { auth: { persistSession: false } });

const BATCH = 500;
for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await supabase.from('questions').upsert(batch, { onConflict: 'code' });
  if (error) {
    console.error(`Upsert failed at batch ${i}:`, error.message);
    process.exit(1);
  }
  console.log(`Upserted ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
}
console.log('Done.');
