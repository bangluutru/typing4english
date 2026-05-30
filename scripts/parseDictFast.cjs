const fs = require('fs');
const path = require('path');

const dictContent = fs.readFileSync(path.join(__dirname, '../src/data/dictionary.ts'), 'utf-8');
const alphabetContent = fs.readFileSync(path.join(__dirname, '../src/data/alphabetWords.ts'), 'utf-8');

let strippedAlphabet = alphabetContent
  .replace(/export const /g, 'const ')
  .replace(/: DictionaryEntry\[\]/g, '')
  .replace(/import type .*/g, '')
  .replace(/import \{.*/g, '');

let strippedDict = dictContent
  .replace(/export const /g, 'const ')
  .replace(/: DictionaryEntry\[\]/g, '')
  .replace(/: string\[\]/g, '')
  .replace(/import type .*/g, '')
  .replace(/import \{.*/g, '');

const script = `
  ${strippedAlphabet}
  ${strippedDict}
  
  const fs = require('fs');
  const path = require('path');
  
  const dataDir = path.join(__dirname, '../public/data');
  const levelsDir = path.join(dataDir, 'levels');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(levelsDir)) fs.mkdirSync(levelsDir, { recursive: true });
  
  fs.writeFileSync(path.join(dataDir, 'boss_words.json'), JSON.stringify(BOSS_WORDS, null, 2));
  fs.writeFileSync(path.join(dataDir, 'phrases.json'), JSON.stringify(PHRASES, null, 2));
  
  const levelsData = {};
  DICTIONARY.forEach(entry => {
    const level = entry.level || 'Kids';
    if (!levelsData[level]) levelsData[level] = [];
    levelsData[level].push(entry);
  });
  
  const levelSizes = {};
  for (const [level, entries] of Object.entries(levelsData)) {
    const filename = String(level).toLowerCase().trim().replace(/[\\s_-]+/g, '_') + '.json';
    fs.writeFileSync(path.join(levelsDir, filename), JSON.stringify(entries, null, 0));
    levelSizes[level] = entries.length;
  }
  
  fs.writeFileSync(path.join(dataDir, 'all_words.json'), JSON.stringify(DICTIONARY, null, 0));
  fs.writeFileSync(path.join(dataDir, 'metadata.json'), JSON.stringify({ levelSizes, totalWords: DICTIONARY.length }, null, 2));
  
  console.log("Success");
`;

fs.writeFileSync(path.join(__dirname, 'tempRun.cjs'), script);
