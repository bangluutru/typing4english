import type { KeyboardLayoutId } from './store';

/* --------------------------------------------------------------------------
   Physical keyboard layouts. Japanese school PCs and Chromebooks use JIS;
   US is kept for imported laptops. Scoring always compares characters, so
   the layout only changes which key and finger the guide points at.
   -------------------------------------------------------------------------- */

export type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'th' | 'ri' | 'rm' | 'rr' | 'rp';
export const LEFT_FINGERS: Finger[] = ['lp', 'lr', 'lm', 'li'];

export interface PhysKey {
  code: string;         // KeyboardEvent.code
  base?: string;        // character without Shift
  shift?: string;       // character with Shift
  label?: string;       // label for non-character keys
  finger: Finger;
  w?: number;           // width in key units (default 1)
  home?: boolean;       // F / J bumps
}

const letters = (s: string, fingers: Finger[]): PhysKey[] =>
  s.split('').map((c, i) => ({ code: `Key${c.toUpperCase()}`, base: c, shift: c.toUpperCase(), finger: fingers[i] }));

const TOP = letters('qwertyuiop', ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp']);
const HOME = letters('asdfghjkl', ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr']).map(k =>
  k.base === 'f' || k.base === 'j' ? { ...k, home: true } : k,
);
const BOTTOM = letters('zxcvbnm', ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri']);
const DIGIT_FINGERS: Finger[] = ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp'];

const digits = (shifts: (string | undefined)[]): PhysKey[] =>
  '1234567890'.split('').map((d, i) => ({ code: `Digit${d}`, base: d, shift: shifts[i], finger: DIGIT_FINGERS[i] }));

const JIS: PhysKey[][] = [
  [
    { code: 'Backquote', label: '半/全', finger: 'lp' },
    ...digits(['!', '"', '#', '$', '%', '&', "'", '(', ')', undefined]),
    { code: 'Minus', base: '-', shift: '=', finger: 'rp' },
    { code: 'Equal', base: '^', shift: '~', finger: 'rp' },
    { code: 'IntlYen', base: '¥', shift: '|', finger: 'rp' },
    { code: 'Backspace', label: 'BS', finger: 'rp', w: 1.2 },
  ],
  [
    { code: 'Tab', label: 'Tab', finger: 'lp', w: 1.5 },
    ...TOP,
    { code: 'BracketLeft', base: '@', shift: '`', finger: 'rp' },
    { code: 'BracketRight', base: '[', shift: '{', finger: 'rp' },
    { code: 'Enter', label: 'Enter', finger: 'rp', w: 1.7 },
  ],
  [
    { code: 'CapsLock', label: '英数', finger: 'lp', w: 1.8 },
    ...HOME,
    { code: 'Semicolon', base: ';', shift: '+', finger: 'rp' },
    { code: 'Quote', base: ':', shift: '*', finger: 'rp' },
    { code: 'Backslash', base: ']', shift: '}', finger: 'rp' },
    { code: 'Enter2', label: '', finger: 'rp', w: 1.4 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', finger: 'lp', w: 2.3 },
    ...BOTTOM,
    { code: 'Comma', base: ',', shift: '<', finger: 'rm' },
    { code: 'Period', base: '.', shift: '>', finger: 'rr' },
    { code: 'Slash', base: '/', shift: '?', finger: 'rp' },
    { code: 'IntlRo', base: '\\', shift: '_', finger: 'rp' },
    { code: 'ShiftRight', label: 'Shift', finger: 'rp', w: 1.9 },
  ],
  [
    { code: 'NonConvert', label: '無変換', finger: 'th', w: 1.6 },
    { code: 'Space', base: ' ', label: '', finger: 'th', w: 6 },
    { code: 'Convert', label: '変換', finger: 'th', w: 1.6 },
    { code: 'KanaMode', label: 'かな', finger: 'th', w: 1.6 },
  ],
];

const US: PhysKey[][] = [
  [
    { code: 'Backquote', base: '`', shift: '~', finger: 'lp' },
    ...digits(['!', '@', '#', '$', '%', '^', '&', '*', '(', ')']),
    { code: 'Minus', base: '-', shift: '_', finger: 'rp' },
    { code: 'Equal', base: '=', shift: '+', finger: 'rp' },
    { code: 'Backspace', label: 'Backspace', finger: 'rp', w: 2 },
  ],
  [
    { code: 'Tab', label: 'Tab', finger: 'lp', w: 1.5 },
    ...TOP,
    { code: 'BracketLeft', base: '[', shift: '{', finger: 'rp' },
    { code: 'BracketRight', base: ']', shift: '}', finger: 'rp' },
    { code: 'Backslash', base: '\\', shift: '|', finger: 'rp', w: 1.5 },
  ],
  [
    { code: 'CapsLock', label: 'Caps', finger: 'lp', w: 1.8 },
    ...HOME,
    { code: 'Semicolon', base: ';', shift: ':', finger: 'rp' },
    { code: 'Quote', base: "'", shift: '"', finger: 'rp' },
    { code: 'Enter', label: 'Enter', finger: 'rp', w: 2.2 },
  ],
  [
    { code: 'ShiftLeft', label: 'Shift', finger: 'lp', w: 2.3 },
    ...BOTTOM,
    { code: 'Comma', base: ',', shift: '<', finger: 'rm' },
    { code: 'Period', base: '.', shift: '>', finger: 'rr' },
    { code: 'Slash', base: '/', shift: '?', finger: 'rp' },
    { code: 'ShiftRight', label: 'Shift', finger: 'rp', w: 2.7 },
  ],
  [{ code: 'Space', base: ' ', label: '', finger: 'th', w: 7 }],
];

export const LAYOUTS: Record<KeyboardLayoutId, PhysKey[][]> = { jis: JIS, us: US };

export interface KeyTarget {
  code: string;
  finger: Finger;
  shift?: 'ShiftLeft' | 'ShiftRight';
}

const charMaps = new Map<KeyboardLayoutId, Map<string, KeyTarget>>();

/** Which key (and which Shift, if any) produces `ch` on this layout. */
export function keyFor(ch: string, layout: KeyboardLayoutId): KeyTarget | undefined {
  let map = charMaps.get(layout);
  if (!map) {
    map = new Map();
    for (const row of LAYOUTS[layout]) {
      for (const k of row) {
        if (k.base) map.set(k.base, { code: k.code, finger: k.finger });
        if (k.shift) {
          // Touch typing: press Shift with the hand that is NOT typing the key.
          const shift = LEFT_FINGERS.includes(k.finger) ? 'ShiftRight' : 'ShiftLeft';
          map.set(k.shift, { code: k.code, finger: k.finger, shift });
        }
      }
    }
    charMaps.set(layout, map);
  }
  return map.get(ch);
}

/** Finger colours follow the Chotto brand hues (fills only). */
export const FINGER_COLOR: Record<Finger, { fill: string; soft: string }> = {
  lp: { fill: 'var(--violet)', soft: 'var(--violet-soft)' },
  rp: { fill: 'var(--violet)', soft: 'var(--violet-soft)' },
  lr: { fill: 'var(--teal)', soft: 'var(--teal-soft)' },
  rr: { fill: 'var(--teal)', soft: 'var(--teal-soft)' },
  lm: { fill: 'var(--green)', soft: 'var(--green-soft)' },
  rm: { fill: 'var(--green)', soft: 'var(--green-soft)' },
  li: { fill: 'var(--orange)', soft: 'var(--orange-soft)' },
  ri: { fill: 'var(--orange)', soft: 'var(--orange-soft)' },
  th: { fill: 'var(--coral)', soft: 'var(--coral-soft)' },
};
