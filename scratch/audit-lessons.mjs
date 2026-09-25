/**
 * Lesson Audit Script
 * Checks all typing lessons for potential issues:
 * 1. Characters not in fingerMapping (can't be typed / no keyboard highlight)
 * 2. Double spaces or trailing spaces
 * 3. Characters that don't match e.key from KeyboardEvent
 * 4. Empty or too-short texts
 * 5. Unreasonable WPM/accuracy targets
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read the raw lessons.ts file and extract lesson data
const lessonsFile = readFileSync(
  resolve(import.meta.dirname, '../src/modules/typing-practice/data/lessons.ts'),
  'utf-8'
);

// Read fingerMapping.ts to extract all mapped keys
const fingerMappingFile = readFileSync(
  resolve(import.meta.dirname, '../src/modules/typing-practice/data/fingerMapping.ts'),
  'utf-8'
);

// Build the set of characters that fingerMapping supports
// From the mappingSetup, extract all keys and shiftKeys
const allMappedChars = new Set();

// Regular keys (lowercase letters, digits, symbols)
const normalKeys = [
  '`', '1', 'q', 'a', 'z',
  '2', 'w', 's', 'x',
  '3', 'e', 'd', 'c',
  '4', '5', 'r', 't', 'f', 'g', 'v', 'b',
  '6', '7', 'y', 'u', 'h', 'j', 'n', 'm',
  '8', 'i', 'k', ',',
  '9', 'o', 'l', '.',
  '0', '-', '=', 'p', '[', ']', ';', "'", '/', '\\',
  ' ', // space
];

// Shift keys (uppercase letters, special symbols)
const shiftKeys = [
  '~', '!', 'Q', 'A', 'Z',
  '@', 'W', 'S', 'X',
  '#', 'E', 'D', 'C',
  '$', '%', 'R', 'T', 'F', 'G', 'V', 'B',
  '^', '&', 'Y', 'U', 'H', 'J', 'N', 'M',
  '*', 'I', 'K', '<',
  '(', 'O', 'L', '>',
  ')', '_', '+', 'P', '{', '}', ':', '"', '?', '|',
];

normalKeys.forEach(k => allMappedChars.add(k));
shiftKeys.forEach(k => allMappedChars.add(k));

// Also add all lowercase letters a-z (covered by the mapping)
for (let i = 97; i <= 122; i++) {
  allMappedChars.add(String.fromCharCode(i));
}

// Parse lessons from the file using regex
const lessonRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*level:\s*(\d+),\s*levelName:\s*'([^']+)',\s*objective:\s*'([^']+)',\s*text:\s*'((?:[^'\\]|\\.)*)',\s*minAccuracy:\s*(\d+),\s*minWpm:\s*(\d+)/g;

const lessons = [];
let match;
while ((match = lessonRegex.exec(lessonsFile)) !== null) {
  lessons.push({
    id: match[1],
    name: match[2],
    level: parseInt(match[3]),
    levelName: match[4],
    objective: match[5],
    text: match[6],
    minAccuracy: parseInt(match[7]),
    minWpm: parseInt(match[8]),
  });
}

console.log(`\n📋 Found ${lessons.length} lessons to audit\n`);
console.log('='.repeat(80));

let totalIssues = 0;

lessons.forEach((lesson, idx) => {
  const issues = [];
  const text = lesson.text;
  const lessonNum = idx + 1;
  
  // 1. Check for characters NOT in fingerMapping
  const unmappedChars = new Set();
  for (const char of text) {
    if (!allMappedChars.has(char)) {
      unmappedChars.add(char);
    }
  }
  if (unmappedChars.size > 0) {
    const charList = [...unmappedChars].map(c => {
      const code = c.charCodeAt(0);
      return `'${c}' (U+${code.toString(16).padStart(4, '0')})`;
    }).join(', ');
    issues.push(`❌ UNMAPPED CHARS: ${charList} — These characters have no fingerMapping entry, so the virtual keyboard won't highlight correctly and typing matching may fail.`);
  }

  // 2. Check for double/trailing/leading spaces
  if (text.includes('  ')) {
    const positions = [];
    let searchIdx = 0;
    while ((searchIdx = text.indexOf('  ', searchIdx)) !== -1) {
      positions.push(searchIdx);
      searchIdx += 1;
    }
    issues.push(`⚠️  DOUBLE SPACES at position(s): ${positions.join(', ')}`);
  }
  if (text.startsWith(' ')) {
    issues.push(`⚠️  LEADING SPACE`);
  }
  if (text.endsWith(' ')) {
    issues.push(`⚠️  TRAILING SPACE`);
  }

  // 3. Check for unusual Unicode characters (curly quotes, em-dashes, etc.)
  const curlyQuotes = text.match(/[\u2018\u2019\u201C\u201D]/g);
  if (curlyQuotes) {
    issues.push(`❌ CURLY QUOTES FOUND: ${[...new Set(curlyQuotes)].map(c => `'${c}' (U+${c.charCodeAt(0).toString(16)})` ).join(', ')} — These won't match standard keyboard input.`);
  }
  
  const emDash = text.match(/[\u2013\u2014]/g);
  if (emDash) {
    issues.push(`❌ EM/EN DASH FOUND — Use regular hyphen (-) instead.`);
  }

  // 4. Check text length
  const wordCount = text.split(/\s+/).length;
  if (text.length < 20) {
    issues.push(`⚠️  VERY SHORT TEXT: ${text.length} chars, ${wordCount} words`);
  }

  // 5. Check WPM feasibility (5 chars = 1 word)
  const estimatedWords = text.length / 5;
  const minutesNeeded = estimatedWords / lesson.minWpm;
  if (minutesNeeded < 0.1) {
    issues.push(`⚠️  TEXT TOO SHORT for ${lesson.minWpm} WPM target (only ~${estimatedWords.toFixed(1)} standard words)`);
  }

  // 6. Check for @ symbol matching
  if (text.includes('@')) {
    // @ is Shift+2, requires fingerMapping for '@'
    if (!allMappedChars.has('@')) {
      issues.push(`❌ '@' CHARACTER may not be properly mapped`);
    }
  }

  // 7. Check for $ symbol matching
  if (text.includes('$')) {
    if (!allMappedChars.has('$')) {
      issues.push(`❌ '$' CHARACTER may not be properly mapped`);
    }
  }

  // Print results
  if (issues.length > 0) {
    totalIssues += issues.length;
    console.log(`\n🔍 Bài ${lessonNum}: ${lesson.name} (${lesson.id})`);
    console.log(`   Level: ${lesson.level} | WPM: ${lesson.minWpm} | Accuracy: ${lesson.minAccuracy}%`);
    console.log(`   Text (${text.length} chars): "${text.substring(0, 80)}${text.length > 80 ? '...' : ''}"`);
    issues.forEach(issue => {
      console.log(`   ${issue}`);
    });
  }
});

console.log('\n' + '='.repeat(80));

if (totalIssues === 0) {
  console.log('\n✅ ALL LESSONS PASSED AUDIT — No issues found!\n');
} else {
  console.log(`\n🚨 TOTAL ISSUES FOUND: ${totalIssues}\n`);
}

// Additional: print all unique characters used across ALL lessons
const allChars = new Set();
lessons.forEach(l => {
  for (const c of l.text) {
    allChars.add(c);
  }
});

console.log(`📊 All unique characters used across all ${lessons.length} lessons:`);
const sortedChars = [...allChars].sort();
console.log(`   ${sortedChars.map(c => {
  const code = c.charCodeAt(0);
  const display = c === ' ' ? '⎵' : c;
  const mapped = allMappedChars.has(c) ? '✅' : '❌';
  return `${mapped} '${display}' (${code})`;
}).join('\n   ')}`);

console.log(`\n   Total unique chars: ${allChars.size}`);
console.log(`   Mapped: ${[...allChars].filter(c => allMappedChars.has(c)).length}`);
console.log(`   Unmapped: ${[...allChars].filter(c => !allMappedChars.has(c)).length}`);
