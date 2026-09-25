/**
 * Deep Lesson Audit - Simulates e.key behavior for all characters
 * 
 * The typing engine compares: e.key === expectedChar
 * 
 * For standard keyboard:
 * - e.key for 'a' press => 'a'
 * - e.key for Shift+'a' => 'A'
 * - e.key for '1' press => '1' 
 * - e.key for Shift+'1' => '!'
 * - e.key for '/' press => '/'
 * - e.key for Shift+'/' => '?'
 * 
 * So the text character must EXACTLY match e.key output.
 * Let's verify each lesson character maps correctly.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const lessonsFile = readFileSync(
  resolve(import.meta.dirname, '../src/modules/typing-practice/data/lessons.ts'),
  'utf-8'
);

// Parse lessons - handle multi-line text fields too
const lessonRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*level:\s*(\d+),\s*levelName:\s*'([^']+)',\s*objective:\s*'((?:[^'\\]|\\.)*)',\s*text:\s*'((?:[^'\\]|\\.)*)',\s*minAccuracy:\s*(\d+),\s*minWpm:\s*(\d+)/g;

const lessons = [];
let match;
while ((match = lessonRegex.exec(lessonsFile)) !== null) {
  lessons.push({
    id: match[1],
    name: match[2],
    level: parseInt(match[3]),
    text: match[6],
    minAccuracy: parseInt(match[7]),
    minWpm: parseInt(match[8]),
  });
}

console.log(`Found ${lessons.length} lessons\n`);

// All valid e.key values from a US QWERTY keyboard
const validEKeys = new Set([
  // Lowercase letters
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  // Uppercase letters (Shift+letter)
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  // Digits
  ...'0123456789'.split(''),
  // Symbols (no Shift)
  '`', '-', '=', '[', ']', '\\', ';', "'", ',', '.', '/',
  // Symbols (with Shift on US keyboard)
  '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+',
  '{', '}', '|', ':', '"', '<', '>', '?',
  // Whitespace
  ' ',
]);

// Check the fingerMapping's checkIsTarget logic
// The VirtualKeyboard does: fingerMapping[targetChar]
// If targetChar is, say, '"', fingerMapping['"'] should exist with:
//   { key: '"', finger: 'rp', requiresShift: true, hand: 'right' }
// And then targetKey = '"' ... but checkIsTarget compares with k.key (lowercase)
// 
// Wait - the checkIsTarget function in VirtualKeyboard does:
//   const targetKey = targetConfig ? targetConfig.key : targetChar.toLowerCase();
//   checkIsTarget(keyLabel) => keyLabel.toLowerCase() === targetKey
//
// So for '"', fingerMapping['"'] = { key: '"', ... }
// targetKey = '"'
// Then it checks each keyboard key: cleanLabel = k.key.toLowerCase() === '"'
// But in keyboardLayout, the key for ' is mapped as: { label: "'", shiftLabel: '"', key: "'", finger: 'rp' }
// So k.key = "'" and cleanLabel = "'"
// And targetKey = '"' 
// "'" !== '"' → won't highlight!
// 
// BUT requiresShift=true, so it checks shift keys
// AND the Shift keys are checked separately via shift-left/shift-right
//
// So the issue is: the VirtualKeyboard checkIsTarget won't highlight the BASE key for Shift characters!
// It only highlights the Shift key, not the key that produces the character.
//
// Let's verify this by examining the fingerMapping for shift characters

// In fingerMapping, shiftKeys entries use the SHIFTED character itself as the key:
// fingerMapping['"'] = { key: '"', finger: 'rp', requiresShift: true, hand: 'right' }
// 
// In VirtualKeyboard: targetKey = fingerMapping['"'].key = '"'
// checkIsTarget(k.key = "'") → "'".toLowerCase() === '"' → FALSE
// 
// This means for Shift characters, the base key is NOT highlighted on virtual keyboard.
// Only the Shift key is highlighted.
// This is a UX issue but NOT a blocking issue - users can still type the character.

// Focus on the BLOCKING issue: characters that can't be typed
// The useTypingEngine compares: e.key === expectedChar
// For lesson 24: 'What is this? (It is a keyboard). "Wow!" he said. Is that 10-finger typing easy? Yes, it is!'
//
// Let's check character by character:

let totalIssues = 0;

lessons.forEach((lesson, idx) => {
  const issues = [];
  const text = lesson.text;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    if (!validEKeys.has(char)) {
      issues.push({
        pos: i,
        char: char,
        code: char.charCodeAt(0),
        context: text.substring(Math.max(0, i-5), Math.min(text.length, i+6)),
      });
    }
  }

  if (issues.length > 0) {
    totalIssues += issues.length;
    console.log(`\n❌ Bài ${idx + 1}: ${lesson.name} (${lesson.id})`);
    console.log(`   Text: "${text}"`);
    issues.forEach(issue => {
      console.log(`   Position ${issue.pos}: '${issue.char}' (U+${issue.code.toString(16).padStart(4, '0')}) in context: "...${issue.context}..."`);
    });
  }
});

if (totalIssues === 0) {
  console.log('✅ All characters in all lessons match valid e.key values\n');
}

// Now check the VIRTUAL KEYBOARD highlight logic more carefully
console.log('\n--- Virtual Keyboard Highlight Audit ---\n');

// For each lesson, check which characters WON'T get properly highlighted
// on the virtual keyboard due to the fingerMapping + checkIsTarget logic

// The fingerMapping maps shift characters like this:
// fingerMapping['?'] = { key: '?', finger: 'rp', requiresShift: true, hand: 'right' }
// 
// In VirtualKeyboard:
// targetKey = fingerMapping['?'].key = '?'
// checkIsTarget('/' /* the base key */) → '/'.toLowerCase() === '?' → FALSE
//
// But for letters:
// fingerMapping['A'] = { key: 'A', finger: 'lp', requiresShift: true, hand: 'left' }
// targetKey = fingerMapping['A'].key = 'A'
// checkIsTarget('a') → 'a'.toLowerCase() === 'a' (from 'A'.toLowerCase()) → ACTUALLY...
// Wait: targetKey = 'A', then checkIsTarget does cleanLabel = k.key.toLowerCase()
// For the 'a' key: k.key = 'a', cleanLabel = 'a'
// 'a' === 'A' → FALSE because targetKey is 'A' and it's compared directly
// 
// WAIT. Let me re-read the code:
// const targetKey = targetConfig ? targetConfig.key : targetChar.toLowerCase();
// checkIsTarget(keyLabel): cleanLabel = keyLabel.toLowerCase(); cleanLabel === targetKey
//
// So for 'A': targetConfig.key = 'A', targetKey = 'A'
// cleanLabel = 'a'.toLowerCase() = 'a'
// 'a' === 'A' → FALSE → base key NOT highlighted
//
// For '?': targetConfig.key = '?', targetKey = '?'
// cleanLabel = '/'.toLowerCase() = '/'
// '/' === '?' → FALSE → base key NOT highlighted
//
// This means ALL shift characters only get the SHIFT KEY highlighted, not the actual key to press!
// This is a real UX bug for lessons that use uppercase letters and special symbols.

console.log('Characters that won\'t highlight base key (only Shift key highlights):');
const shiftCharsUsed = new Set();
lessons.forEach((lesson, idx) => {
  for (const char of lesson.text) {
    // Check if this is a shift character
    const isUpperCase = char >= 'A' && char <= 'Z';
    const isShiftSymbol = '~!@#$%^&*()_+{}|:"<>?'.includes(char);
    if (isUpperCase || isShiftSymbol) {
      shiftCharsUsed.add(char);
    }
  }
});

console.log(`  Shift characters used: ${[...shiftCharsUsed].sort().map(c => `'${c}'`).join(', ')}`);
console.log(`  These will highlight the Shift key but NOT the base key on virtual keyboard.`);
console.log(`  This is a known UX limitation but does NOT block typing.\n`);

// Check for the REAL issue: potential mismatch between text and what e.key produces
// Let's specifically look at lesson 24 text character-by-character
console.log('\n--- Lesson 24 Deep Analysis ---\n');
const lesson24 = lessons[23]; // 0-indexed, lesson 24 is index 23
if (lesson24) {
  console.log(`Text: "${lesson24.text}"`);
  console.log(`Length: ${lesson24.text.length} chars`);
  console.log(`\nCharacter breakdown:`);
  
  for (let i = 0; i < lesson24.text.length; i++) {
    const c = lesson24.text[i];
    const code = c.charCodeAt(0);
    const isShift = c >= 'A' && c <= 'Z' || '~!@#$%^&*()_+{}|:"<>?'.includes(c);
    const status = validEKeys.has(c) ? '✅' : '❌';
    
    if (!validEKeys.has(c) || isShift) {
      console.log(`  [${i.toString().padStart(2)}] ${status} '${c}' (U+${code.toString(16).padStart(4, '0')}) ${isShift ? '[SHIFT]' : ''}`);
    }
  }
} else {
  console.log('Could not find lesson 24!');
}
