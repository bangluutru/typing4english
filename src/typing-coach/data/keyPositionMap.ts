import type { FingerId } from '../../types/game';

export interface KeyPosition {
  key: string;
  display: string;
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  finger: FingerId;
  isHomeKey?: boolean;
  isModifier?: boolean;
}

// ── Layout constants ──
const KW = 56;        // standard key width
const KH = 48;        // standard key height
const GAP = 4;        // gap between keys
const STRIDE = KW + GAP; // 60px per key step

// Row Y positions (3 letter rows + space)
const R0_Y = 12;                    // top row
const R1_Y = R0_Y + KH + GAP;      // home row = 64
const R2_Y = R1_Y + KH + GAP;      // bottom row = 116
const SPACE_Y = R2_Y + KH + GAP;   // space bar = 168

// Row X offsets (QWERTY stagger)
const R0_X = 68;    // top row
const R1_X = 82;    // home row (staggered right ~14px)
const R2_X = 100;   // bottom row (staggered right ~18px more)

function makeKey(
  key: string, display: string, rowY: number, rowX: number, col: number,
  finger: FingerId, opts?: { isHomeKey?: boolean; width?: number; isModifier?: boolean }
): KeyPosition {
  const w = opts?.width ?? KW;
  const x = rowX + col * STRIDE;
  return {
    key, display,
    x, y: rowY,
    width: w, height: KH,
    centerX: x + w / 2,
    centerY: rowY + KH / 2,
    finger,
    isHomeKey: opts?.isHomeKey,
    isModifier: opts?.isModifier,
  };
}

// ── Full QWERTY staggered layout ──
// SVG viewBox will be 860×310
export const KEY_POSITIONS: KeyPosition[] = [
  // ─── Row 0 (Top): Tab Q W E R T Y U I O P - ───
  { key: 'tab', display: 'Tab', x: 8, y: R0_Y, width: 56, height: KH,
    centerX: 36, centerY: R0_Y + KH / 2, finger: 'left-pinky', isModifier: true },
  makeKey('q', 'Q', R0_Y, R0_X, 0, 'left-pinky'),
  makeKey('w', 'W', R0_Y, R0_X, 1, 'left-ring'),
  makeKey('e', 'E', R0_Y, R0_X, 2, 'left-middle'),
  makeKey('r', 'R', R0_Y, R0_X, 3, 'left-index'),
  makeKey('t', 'T', R0_Y, R0_X, 4, 'left-index'),
  makeKey('y', 'Y', R0_Y, R0_X, 5, 'right-index'),
  makeKey('u', 'U', R0_Y, R0_X, 6, 'right-index'),
  makeKey('i', 'I', R0_Y, R0_X, 7, 'right-middle'),
  makeKey('o', 'O', R0_Y, R0_X, 8, 'right-ring'),
  makeKey('p', 'P', R0_Y, R0_X, 9, 'right-pinky'),
  makeKey('-', '-', R0_Y, R0_X, 10, 'right-pinky'),

  // ─── Row 1 (Home): Caps A S D F G H J K L ; ' Enter ───
  { key: 'caps', display: 'Caps', x: 8, y: R1_Y, width: 70, height: KH,
    centerX: 43, centerY: R1_Y + KH / 2, finger: 'left-pinky', isModifier: true },
  makeKey('a', 'A', R1_Y, R1_X, 0, 'left-pinky', { isHomeKey: true }),
  makeKey('s', 'S', R1_Y, R1_X, 1, 'left-ring', { isHomeKey: true }),
  makeKey('d', 'D', R1_Y, R1_X, 2, 'left-middle', { isHomeKey: true }),
  makeKey('f', 'F', R1_Y, R1_X, 3, 'left-index', { isHomeKey: true }),
  makeKey('g', 'G', R1_Y, R1_X, 4, 'left-index'),
  makeKey('h', 'H', R1_Y, R1_X, 5, 'right-index'),
  makeKey('j', 'J', R1_Y, R1_X, 6, 'right-index', { isHomeKey: true }),
  makeKey('k', 'K', R1_Y, R1_X, 7, 'right-middle', { isHomeKey: true }),
  makeKey('l', 'L', R1_Y, R1_X, 8, 'right-ring', { isHomeKey: true }),
  makeKey(';', ';', R1_Y, R1_X, 9, 'right-pinky', { isHomeKey: true }),
  makeKey('\'', '\'', R1_Y, R1_X, 10, 'right-pinky'),
  { key: 'enter', display: '↵', x: R1_X + 11 * STRIDE, y: R1_Y, width: 68, height: KH,
    centerX: R1_X + 11 * STRIDE + 34, centerY: R1_Y + KH / 2, finger: 'right-pinky', isModifier: true },

  // ─── Row 2 (Bottom): Shift Z X C V B N M , . / Shift ───
  { key: 'lshift', display: 'Shift', x: 8, y: R2_Y, width: 88, height: KH,
    centerX: 52, centerY: R2_Y + KH / 2, finger: 'left-pinky', isModifier: true },
  makeKey('z', 'Z', R2_Y, R2_X, 0, 'left-pinky'),
  makeKey('x', 'X', R2_Y, R2_X, 1, 'left-ring'),
  makeKey('c', 'C', R2_Y, R2_X, 2, 'left-middle'),
  makeKey('v', 'V', R2_Y, R2_X, 3, 'left-index'),
  makeKey('b', 'B', R2_Y, R2_X, 4, 'left-index'),
  makeKey('n', 'N', R2_Y, R2_X, 5, 'right-index'),
  makeKey('m', 'M', R2_Y, R2_X, 6, 'right-index'),
  makeKey(',', ',', R2_Y, R2_X, 7, 'right-middle'),
  makeKey('.', '.', R2_Y, R2_X, 8, 'right-ring'),
  makeKey('/', '/', R2_Y, R2_X, 9, 'right-pinky'),
  { key: 'rshift', display: 'Shift', x: R2_X + 10 * STRIDE, y: R2_Y, width: 88, height: KH,
    centerX: R2_X + 10 * STRIDE + 44, centerY: R2_Y + KH / 2, finger: 'right-pinky', isModifier: true },

  // ─── Space bar ───
  { key: ' ', display: 'SPACE', x: 240, y: SPACE_Y, width: 340, height: KH,
    centerX: 410, centerY: SPACE_Y + KH / 2, finger: 'right-thumb' },
];

export const getKeyPosition = (key: string): KeyPosition | null => {
  const normalized = key.toLowerCase();
  return KEY_POSITIONS.find(p => p.key === normalized) || null;
};

// ── Derived home row fingertip rest positions ──
const findKey = (k: string) => KEY_POSITIONS.find(p => p.key === k)!;

export const HOME_ROW_CENTERS: Record<string, { x: number; y: number }> = {
  'left-pinky':  { x: findKey('a').centerX,  y: findKey('a').centerY },
  'left-ring':   { x: findKey('s').centerX,  y: findKey('s').centerY },
  'left-middle': { x: findKey('d').centerX,  y: findKey('d').centerY },
  'left-index':  { x: findKey('f').centerX,  y: findKey('f').centerY },
  'left-thumb':  { x: findKey(' ').centerX - 80, y: findKey(' ').centerY },
  'right-thumb': { x: findKey(' ').centerX + 80, y: findKey(' ').centerY },
  'right-index': { x: findKey('j').centerX,  y: findKey('j').centerY },
  'right-middle':{ x: findKey('k').centerX,  y: findKey('k').centerY },
  'right-ring':  { x: findKey('l').centerX,  y: findKey('l').centerY },
  'right-pinky': { x: findKey(';').centerX,  y: findKey(';').centerY },
};

// ── Palm base positions (below keyboard, at wrist level) ──
const WRIST_Y = SPACE_Y + KH + 30; // 30px below space bar bottom

export const PALM_BASES: Record<string, { x: number; y: number }> = {
  'left-pinky':  { x: findKey('a').centerX,       y: WRIST_Y },
  'left-ring':   { x: findKey('s').centerX,        y: WRIST_Y - 8 },
  'left-middle': { x: findKey('d').centerX,        y: WRIST_Y - 10 },
  'left-index':  { x: findKey('f').centerX,        y: WRIST_Y - 6 },
  'left-thumb':  { x: findKey(' ').centerX - 50,   y: WRIST_Y + 10 },
  'right-thumb': { x: findKey(' ').centerX + 50,   y: WRIST_Y + 10 },
  'right-index': { x: findKey('j').centerX,        y: WRIST_Y - 6 },
  'right-middle':{ x: findKey('k').centerX,        y: WRIST_Y - 10 },
  'right-ring':  { x: findKey('l').centerX,        y: WRIST_Y - 8 },
  'right-pinky': { x: findKey(';').centerX,        y: WRIST_Y },
};
