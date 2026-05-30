const fs = require('fs');
const path = require('path');

const configs = [
  { input: '../scratch/toeic_input.txt', json: '../public/data/levels/TOEIC.json', out: 'toeic_missing.json' },
  { input: '../scratch/toefl_input.txt', json: '../public/data/levels/TOEFL.json', out: 'toefl_missing.json' },
  // Note: the IELTS input file in translate_and_generate.py was hardcoded to a path /Users/...
  // Let's check if scratch/ielts_input.txt exists.
];

const scratchDir = path.join(__dirname, '../scratch');
const ieltsPath = path.join(scratchDir, 'ielts_input.txt');
if (fs.existsSync(ieltsPath)) {
  configs.push({ input: '../scratch/ielts_input.txt', json: '../public/data/levels/IELTS.json', out: 'ielts_missing.json' });
} else {
  // Let's try to find any ielts csv or txt in scratch
  const files = fs.readdirSync(scratchDir);
  const ieltsFile = files.find(f => f.toLowerCase().includes('ielts') && (f.endsWith('.txt') || f.endsWith('.csv')));
  if (ieltsFile) {
    configs.push({ input: '../scratch/' + ieltsFile, json: '../public/data/levels/IELTS.json', out: 'ielts_missing.json' });
  }
}

for (const cfg of configs) {
  const inputPath = path.join(__dirname, cfg.input);
  const jsonPath = path.join(__dirname, cfg.json);
  const outPath = path.join(__dirname, '../scratch', cfg.out);
  
  if (!fs.existsSync(inputPath)) {
    console.log(`Skipping ${cfg.input} - not found`);
    continue;
  }
  
  let rawContent = fs.readFileSync(inputPath, 'utf-8');
  let inputWords = rawContent.split('\n').map(l => l.strip ? l.trim() : l.replace(/\r?\n|\r/g, '').trim()).filter(l => l.length > 0 && l.toLowerCase() !== 'english' && l.toLowerCase() !== 'word');
  
  // Deduplicate input words
  inputWords = [...new Set(inputWords.map(w => w.toLowerCase()))];
  
  let existingWords = [];
  if (fs.existsSync(jsonPath)) {
    const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    existingWords = existingData.map(e => e.word.toLowerCase());
  }
  
  const existingSet = new Set(existingWords);
  const missingWords = inputWords.filter(w => !existingSet.has(w));
  
  fs.writeFileSync(outPath, JSON.stringify(missingWords, null, 2));
  console.log(`[${cfg.out}] Input: ${inputWords.length} | Existing: ${existingWords.length} | Missing: ${missingWords.length}`);
}
