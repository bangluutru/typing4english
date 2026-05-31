import fs from 'fs';
import path from 'path';

// Regex for Vietnamese characters (case insensitive)
const VI_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
// Regex for Japanese characters (Hiragana, Katakana, Kanji)
const JA_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;

const EXCLUDED_FILES = [
  'translations.ts',
  'lessons.ts',
  'fingerMapping.ts',
  'api.ts',
  'UserGuideModal.tsx'
];

const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist'
];

function stripComments(content) {
  // Strip multi-line comments
  let clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip single-line comments, but be careful not to match URLs (e.g. http://)
  // A safer way is to split by lines and strip from // onwards if not inside a string
  const lines = clean.split('\n');
  const cleanLines = lines.map(line => {
    // Simple check: if a line contains //, strip everything after it, unless it's preceded by : (like http://)
    const commentIdx = line.indexOf('//');
    if (commentIdx !== -1 && (commentIdx === 0 || line[commentIdx - 1] !== ':')) {
      return line.substring(0, commentIdx);
    }
    return line;
  });
  return cleanLines.join('\n');
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(file)) {
        walkDir(filePath, fileList);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if ((ext === '.ts' || ext === '.tsx') && !EXCLUDED_FILES.includes(file)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function runAudit() {
  console.log('🔍 Starting Global i18n Leak Audit...');
  const srcDir = path.resolve('src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ Error: src directory not found!');
    process.exit(1);
  }

  const files = walkDir(srcDir);
  let hasLeaks = false;
  let totalViolations = 0;

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf8');
    const cleanContent = stripComments(content);
    
    const lines = cleanContent.split('\n');
    let fileHasLeaks = false;

    lines.forEach((line, index) => {
      const hasVi = VI_REGEX.test(line);
      const hasJa = JA_REGEX.test(line);

      if (hasVi || hasJa) {
        if (!fileHasLeaks) {
          console.log(`\n📄 File: ${relativePath}`);
          fileHasLeaks = true;
          hasLeaks = true;
        }
        totalViolations++;
        const langStr = [hasVi ? 'Vietnamese' : '', hasJa ? 'Japanese' : ''].filter(Boolean).join(' & ');
        console.log(`  Line ${index + 1}: [Leak: ${langStr}] -> "${line.trim()}"`);
      }
    });
  }

  console.log('\n==================================================');
  if (hasLeaks) {
    console.error(`❌ i18n Audit FAILED! Found ${totalViolations} hardcoded translation leak(s).`);
    process.exit(1);
  } else {
    console.log('✅ i18n Audit PASSED! Zero hardcoded translation leaks found.');
    process.exit(0);
  }
}

runAudit();
