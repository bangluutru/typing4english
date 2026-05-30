const fs = require('fs');
const path = require('path');

const filesToParse = [
  { ts: 'ieltsWords.ts', arrayName: 'IELTS_WORDS', json: 'IELTS.json' },
  { ts: 'toeflWords.ts', arrayName: 'TOEFL_WORDS', json: 'TOEFL.json' },
  { ts: 'toeicWords.ts', arrayName: 'TOEIC_WORDS', json: 'TOEIC.json' }
];

const dataDir = path.join(__dirname, '../src/data');
const outDir = path.join(__dirname, '../public/data/levels');

let allWords = [];

for (const file of filesToParse) {
  const tsPath = path.join(dataDir, file.ts);
  if (!fs.existsSync(tsPath)) {
    console.log(`File not found: ${tsPath}`);
    continue;
  }
  
  let content = fs.readFileSync(tsPath, 'utf-8');
  // Strip TypeScript stuff to make it valid JS
  content = content.replace(/import type .*/g, '')
                   .replace(/export const /g, 'const ')
                   .replace(/: DictionaryEntry\[\]/g, '');
  
  // Evaluate the code
  const context = {};
  const script = content + `\nmodule.exports = ${file.arrayName};`;
  
  try {
    const mod = { exports: {} };
    const func = new Function('module', 'exports', script);
    func(mod, mod.exports);
    
    const wordsArray = mod.exports;
    console.log(`Parsed ${wordsArray.length} words from ${file.ts}`);
    
    // Save to JSON
    fs.writeFileSync(
      path.join(outDir, file.json),
      JSON.stringify(wordsArray)
    );
    
    allWords = allWords.concat(wordsArray);
  } catch (err) {
    console.error(`Error evaluating ${file.ts}:`, err);
  }
}

// Update all_words.json
const allWordsPath = path.join(__dirname, '../public/data/all_words.json');
if (fs.existsSync(allWordsPath)) {
  const existingAllWords = JSON.parse(fs.readFileSync(allWordsPath, 'utf-8'));
  // Remove existing IELTS, TOEFL, TOEIC from all_words
  const filtered = existingAllWords.filter(w => !['IELTS', 'TOEFL', 'TOEIC'].includes(w.level));
  const newAllWords = filtered.concat(allWords);
  fs.writeFileSync(allWordsPath, JSON.stringify(newAllWords));
  console.log(`Updated all_words.json. New total length: ${newAllWords.length}`);
}
