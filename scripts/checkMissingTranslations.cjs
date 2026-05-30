const fs = require('fs');
const path = require('path');

const levelsDir = path.join(__dirname, '../public/data/levels');
const allFiles = fs.readdirSync(levelsDir).filter(f => f.endsWith('.json'));

let totalWords = 0;
let missingVi = 0;
let missingJa = 0;
let missingBoth = 0;

const summary = {};

for (const file of allFiles) {
  const content = fs.readFileSync(path.join(levelsDir, file), 'utf-8');
  const data = JSON.parse(content);
  
  let fileMissingVi = 0;
  let fileMissingJa = 0;
  let fileMissingBoth = 0;
  
  for (const entry of data) {
    totalWords++;
    const hasVi = entry.meaning_vi && entry.meaning_vi.trim().length > 0;
    const hasJa = entry.meaning_ja && entry.meaning_ja.trim().length > 0;
    
    if (!hasVi && !hasJa) {
      fileMissingBoth++;
      missingBoth++;
    } else if (!hasVi) {
      fileMissingVi++;
      missingVi++;
    } else if (!hasJa) {
      fileMissingJa++;
      missingJa++;
    }
  }
  
  if (fileMissingVi > 0 || fileMissingJa > 0 || fileMissingBoth > 0) {
    summary[file] = {
      total: data.length,
      missingVi: fileMissingVi,
      missingJa: fileMissingJa,
      missingBoth: fileMissingBoth
    };
  }
}

console.log('Total words:', totalWords);
console.log('Missing ONLY Vietnamese:', missingVi);
console.log('Missing ONLY Japanese:', missingJa);
console.log('Missing BOTH (Vi & Ja):', missingBoth);
console.log('Total missing any:', missingVi + missingJa + missingBoth);
console.log('\nBreakdown by file:');
console.table(summary);
