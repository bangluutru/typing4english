const fs = require('fs');
const path = require('path');

const level = process.argv[2] || 'TOEIC';
const scratchDir = path.join(__dirname, '../scratch');
const targetFile = path.join(__dirname, `../public/data/levels/${level}.json`);
const allWordsFile = path.join(__dirname, `../public/data/all_words.json`);

// 1. Read existing target file
let targetData = [];
if (fs.existsSync(targetFile)) {
  targetData = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
}
const existingWordsSet = new Set(targetData.map(d => d.word.toLowerCase()));

// 2. Find all trans chunks for this level
const files = fs.readdirSync(scratchDir).filter(f => f.toLowerCase().startsWith(level.toLowerCase() + '_trans_') && f.endsWith('.json'));

let newWordsAdded = 0;

for (const file of files) {
  const filePath = path.join(scratchDir, file);
  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    
    const lines = rawContent.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Remove trailing comma or closing bracket
      if (line.endsWith(',')) line = line.slice(0, -1);
      if (line.endsWith(']')) line = line.slice(0, -1);
      if (line.startsWith('[')) line = line.substring(1);
      
      // Clean up quotes
      line = line.replace(/^"/, '').replace(/"$/, '');
      
      let word, vi, ja, diff;
      
      if (line.includes('","')) {
        // format: "word","vi","ja",3
        const parts = line.split('","');
        if (parts.length >= 3) {
          word = parts[0].replace(/"/g, '');
          vi = parts[1].replace(/"/g, '');
          const lastParts = parts[2].split('",');
          ja = lastParts[0].replace(/"/g, '');
          diff = lastParts.length > 1 ? lastParts[1].replace(/"/g, '').replace(/\]/g, '') : "1";
        }
      } else if (line.includes('|')) {
        // format: word|vi|ja|3
        const parts = line.split('|');
        if (parts.length >= 3) {
          word = parts[0];
          vi = parts[1];
          ja = parts[2];
          diff = parts[3] ? parts[3].replace(/\]/g, '') : "1";
        }
      }
      
      if (word && vi && ja) {
        const w = word.trim().replace(/^"/, '');
        if (!existingWordsSet.has(w.toLowerCase())) {
          targetData.push({
            word: w,
            meaning_vi: vi.trim(),
            meaning_ja: ja.trim(),
            level: level,
            difficulty: parseInt(diff) || 1
          });
          existingWordsSet.add(w.toLowerCase());
          newWordsAdded++;
        }
      }
    }
    
    console.log(`Processed ${file}, total words so far: ${targetData.length}`);
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
}

// 3. Save back to target file
fs.writeFileSync(targetFile, JSON.stringify(targetData, null, 2));
console.log(`Saved ${targetFile} with ${targetData.length} words. (${newWordsAdded} new)`);

// 4. Update all_words.json
if (fs.existsSync(allWordsFile)) {
  let allWords = JSON.parse(fs.readFileSync(allWordsFile, 'utf-8'));
  allWords = allWords.filter(w => w.level !== level);
  allWords = allWords.concat(targetData);
  fs.writeFileSync(allWordsFile, JSON.stringify(allWords, null, 2));
  console.log(`Updated ${allWordsFile}. Total length: ${allWords.length}`);
}
