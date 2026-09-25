#!/usr/bin/env node
/**
 * Pull the vocabulary lists from 英級アップ (eikyu-up, repo eiken-compass) and
 * write the compact per-grade files this app loads at runtime.
 *
 *   node scripts/sync-eikyu-vocab.mjs                 # read the local eiken-guru checkout
 *   EIKYU_SRC=https://eiken-compass.pages.dev node scripts/sync-eikyu-vocab.mjs
 *
 * Source: <EIKYU_SRC>/data/vocab/grade-{g}.json (the site's built public data).
 * Output: public/data/vocab/{g}.json + public/data/vocab/index.json
 *
 * Words are kept only when every character can be typed on a plain keyboard:
 * accents are folded (café → cafe), anything else non-ASCII drops the word.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_SRC = path.resolve(ROOT, '../../eiken-guru/public');
const SRC = process.env.EIKYU_SRC || DEFAULT_SRC;
const OUT = path.join(ROOT, 'public/data/vocab');
const GRADES = ['5', '4', '3', 'pre2', '2', 'pre1', '1'];
const AUDIO_PREFIX = '/api/media/audio/vocab/';

// eikyu-up's categories mix real topics with internal batch labels ("Adj R3",
// "C1 Verbs Top-off"). Fold them into topics a child can recognise. First match wins.
const TOPIC_RULES = [
  ['family', /^family$/i],
  ['body', /^body$|health & body/i],
  ['colors', /^colors$/i],
  ['numbers', /numbers|time/i],
  ['food', /food|gastronomy/i],
  ['animals', /animals/i],
  ['clothing', /clothing/i],
  ['school', /^school$|^education/i],
  ['places', /^places$|travel|transport|maritime/i],
  ['people', /people|jobs/i],
  ['things', /^things$/i],
  ['weather', /weather|climate|nature|geography|ecology|environment/i],
  ['sports', /sports|hobbies/i],
  ['daily', /daily life|everyday/i],
  ['feelings', /emotion|psycholog/i],
  ['communication', /communication|media/i],
  ['society', /society|social|culture|current affairs|modern issues|digital society/i],
  ['arts', /art|music|literature|architecture/i],
  ['science', /science|sci-tech|technology|space|mathematics|medicine|ai &/i],
  ['business', /business|econom|finance|development/i],
  ['law', /law|legal|govern|politic|diplomacy|geopolitics|military|criminal/i],
  ['history', /history|archaeology|anthropology|religion|philosoph|ethics/i],
  ['idioms', /idiom|phrase|collocation/i],
  ['connectors', /adverb|connector|discourse|rhetoric/i],
  ['verbs', /verb/i],
  ['adjectives', /adj/i],
  ['academic', /academic|awl|linguistic|power words|specialized|nouns/i],
];
const topicOf = (category, pos) => {
  for (const [id, re] of TOPIC_RULES) if (re.test(category)) return id;
  if (/verb/.test(pos)) return 'verbs';
  if (/adj/.test(pos)) return 'adjectives';
  return 'more';
};

const fold = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[’‘]/g, "'").replace(/[–—]/g, '-');
const TYPABLE = /^[A-Za-z0-9 '\-.,!?]+$/;

async function readGrade(g) {
  const rel = `data/vocab/grade-${g}.json`;
  if (/^https?:/.test(SRC)) {
    const res = await fetch(`${SRC.replace(/\/$/, '')}/${rel}`);
    if (!res.ok) throw new Error(`${rel}: HTTP ${res.status}`);
    return res.json();
  }
  return JSON.parse(fs.readFileSync(path.join(SRC, rel), 'utf8'));
}

const audioName = url => (url && url.startsWith(AUDIO_PREFIX) ? url.slice(AUDIO_PREFIX.length) : undefined);

fs.mkdirSync(OUT, { recursive: true });
const index = { source: 'eikyu-up', syncedAt: new Date().toISOString().slice(0, 10), grades: {} };

for (const g of GRADES) {
  const raw = await readGrade(g);
  const seen = new Set();
  const words = [];
  let dropped = 0;
  for (const v of raw.sort((a, b) => a.order - b.order)) {
    const w = fold(String(v.word || '').trim());
    if (!w || !TYPABLE.test(w) || !v.meaning_ja) { dropped++; continue; }
    const key = w.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const ex = v.example_en ? fold(v.example_en.trim()) : '';
    const item = {
      id: `${g}-${String(v.order).padStart(4, '0')}`,
      w,
      ipa: v.reading || undefined,
      pos: v.part_of_speech || undefined,
      t: topicOf(v.category || '', v.part_of_speech || ''),
      ja: v.meaning_ja,
      vi: v.meaning_vi || undefined,
      ex: ex && /^[\x20-\x7E]+$/.test(ex) ? ex : undefined,
      exJa: ex ? v.example_ja || undefined : undefined,
      exVi: ex ? v.example_vi || undefined : undefined,
      a: audioName(v.word_audio_url),
      ea: ex ? audioName(v.example_audio_ref) : undefined,
    };
    words.push(JSON.parse(JSON.stringify(item))); // drop undefined keys
  }
  fs.writeFileSync(path.join(OUT, `${g}.json`), JSON.stringify(words));
  const topics = {};
  for (const w of words) topics[w.t] = (topics[w.t] || 0) + 1;
  index.grades[g] = { count: words.length, topics };
  console.log(`grade ${g}: ${words.length} words (${dropped} dropped), ${Object.keys(topics).length} topics`);
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 2));
