import fs from 'fs';
import path from 'path';
import { DICTIONARY, BOSS_WORDS, PHRASES } from '../src/data/dictionary';

const dataDir = path.join(__dirname, '..', 'public', 'data');
const levelsDir = path.join(dataDir, 'levels');

// Ensure directories exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(levelsDir)) {
  fs.mkdirSync(levelsDir, { recursive: true });
}

// Write BOSS_WORDS
fs.writeFileSync(
  path.join(dataDir, 'boss_words.json'),
  JSON.stringify(BOSS_WORDS, null, 2),
  'utf-8'
);
console.log('Saved boss_words.json');

// Write PHRASES
fs.writeFileSync(
  path.join(dataDir, 'phrases.json'),
  JSON.stringify(PHRASES, null, 2),
  'utf-8'
);
console.log('Saved phrases.json');

// Group DICTIONARY by level
const levelsData: Record<string, any[]> = {};
DICTIONARY.forEach((entry: any) => {
  const level = entry.level || 'Kids';
  if (!levelsData[level]) {
    levelsData[level] = [];
  }
  levelsData[level].push(entry);
});

// Write level files and collect sizes
const levelSizes: Record<string, number> = {};
for (const [level, entries] of Object.entries(levelsData)) {
  // normalize level name for filename
  const filename = String(level).toLowerCase().trim().replace(/[\s_-]+/g, '_') + '.json';
  fs.writeFileSync(
    path.join(levelsDir, filename),
    JSON.stringify(entries, null, 0), // minified
    'utf-8'
  );
  levelSizes[level] = entries.length;
  console.log(`Saved ${filename} (${entries.length} words)`);
}

// Write all_words.json (for dictionary viewer)
fs.writeFileSync(
  path.join(dataDir, 'all_words.json'),
  JSON.stringify(DICTIONARY, null, 0),
  'utf-8'
);
console.log(`Saved all_words.json (${DICTIONARY.length} words)`);

// Write metadata
fs.writeFileSync(
  path.join(dataDir, 'metadata.json'),
  JSON.stringify({ levelSizes, totalWords: DICTIONARY.length }, null, 2),
  'utf-8'
);
console.log('Saved metadata.json');

console.log('Extraction complete!');
