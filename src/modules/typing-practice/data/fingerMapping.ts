export type FingerType =
  | 'lp' // Left Pinky (Ngón út trái)
  | 'lr' // Left Ring (Ngón áp út trái)
  | 'lm' // Left Middle (Ngón giữa trái)
  | 'li' // Left Index (Ngón trỏ trái)
  | 'lt' // Left Thumb (Ngón cái trái)
  | 'rt' // Right Thumb (Ngón cái phải)
  | 'ri' // Right Index (Ngón trỏ phải)
  | 'rm' // Right Middle (Ngón giữa phải)
  | 'rr' // Right Ring (Ngón áp út phải)
  | 'rp'; // Right Pinky (Ngón út phải)

export interface KeyConfig {
  key: string;
  finger: FingerType;
  requiresShift: boolean;
  hand: 'left' | 'right';
}

// Map mapping character to the finger and hand
export const fingerMapping: Record<string, KeyConfig> = {};

const mappingSetup: { finger: FingerType; keys: string[]; shiftKeys: string[]; hand: 'left' | 'right' }[] = [
  {
    finger: 'lp',
    keys: ['`', '1', 'q', 'a', 'z', 'tab', 'capslock', 'shift-left'],
    shiftKeys: ['~', '!', 'Q', 'A', 'Z'],
    hand: 'left',
  },
  {
    finger: 'lr',
    keys: ['2', 'w', 's', 'x'],
    shiftKeys: ['@', 'W', 'S', 'X'],
    hand: 'left',
  },
  {
    finger: 'lm',
    keys: ['3', 'e', 'd', 'c'],
    shiftKeys: ['#', 'E', 'D', 'C'],
    hand: 'left',
  },
  {
    finger: 'li',
    keys: ['4', '5', 'r', 't', 'f', 'g', 'v', 'b'],
    shiftKeys: ['$', '%', 'R', 'T', 'F', 'G', 'V', 'B'],
    hand: 'left',
  },
  {
    finger: 'lt',
    keys: [], // Space matches thumbs, setup separately
    shiftKeys: [],
    hand: 'left',
  },
  {
    finger: 'rt',
    keys: [' '], // Space
    shiftKeys: [],
    hand: 'right',
  },
  {
    finger: 'ri',
    keys: ['6', '7', 'y', 'u', 'h', 'j', 'n', 'm'],
    shiftKeys: ['^', '&', 'Y', 'U', 'H', 'J', 'N', 'M'],
    hand: 'right',
  },
  {
    finger: 'rm',
    keys: ['8', 'i', 'k', ','],
    shiftKeys: ['*', 'I', 'K', '<'],
    hand: 'right',
  },
  {
    finger: 'rr',
    keys: ['9', 'o', 'l', '.'],
    shiftKeys: ['(', 'O', 'L', '>'],
    hand: 'right',
  },
  {
    finger: 'rp',
    keys: ['0', '-', '=', 'p', '[', ']', ';', "'", '/', '\\', 'enter', 'backspace', 'shift-right'],
    shiftKeys: [')', '_', '+', 'P', '{', '}', ':', '"', '?', '|'],
    hand: 'right',
  },
];

// Populate fingerMapping record
mappingSetup.forEach(({ finger, keys, shiftKeys, hand }) => {
  keys.forEach((k) => {
    fingerMapping[k] = { key: k, finger, requiresShift: false, hand };
  });
  shiftKeys.forEach((k) => {
    fingerMapping[k] = { key: k, finger, requiresShift: true, hand };
  });
});

// Specially map spacebar
fingerMapping[' '] = { key: ' ', finger: 'rt', requiresShift: false, hand: 'right' };

// Map finger names to Vietnamese readable labels
export const fingerLabels: Record<FingerType, string> = {
  lp: 'Ngón út tay trái',
  lr: 'Ngón áp út tay trái',
  lm: 'Ngón giữa tay trái',
  li: 'Ngón trỏ tay trái',
  lt: 'Ngón cái tay trái',
  rt: 'Ngón cái tay phải',
  ri: 'Ngón trỏ tay phải',
  rm: 'Ngón giữa tay phải',
  rr: 'Ngón áp út tay phải',
  rp: 'Ngón út tay phải',
};

// Colors associated with each finger (soft harmonious colors for visual guide)
export const fingerColors: Record<FingerType, string> = {
  lp: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-300',
  lr: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300',
  lm: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300',
  li: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300',
  lt: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-300',
  rt: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-300',
  ri: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300',
  rm: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300',
  rr: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300',
  rp: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300',
};

// Finger colors on virtual keyboard (Tailwind class names for keys)
export const keyFingerColors: Record<FingerType, string> = {
  lp: 'border-pink-400/40 hover:bg-pink-500/10 dark:hover:bg-pink-400/10',
  lr: 'border-purple-400/40 hover:bg-purple-500/10 dark:hover:bg-purple-400/10',
  lm: 'border-indigo-400/40 hover:bg-indigo-500/10 dark:hover:bg-indigo-400/10',
  li: 'border-blue-400/40 hover:bg-blue-500/10 dark:hover:bg-blue-400/10',
  lt: 'border-teal-400/40 hover:bg-teal-500/10 dark:hover:bg-teal-400/10',
  rt: 'border-teal-400/40 hover:bg-teal-500/10 dark:hover:bg-teal-400/10',
  ri: 'border-emerald-400/40 hover:bg-emerald-500/10 dark:hover:bg-emerald-400/10',
  rm: 'border-yellow-400/40 hover:bg-yellow-500/10 dark:hover:bg-yellow-400/10',
  rr: 'border-orange-400/40 hover:bg-orange-500/10 dark:hover:bg-orange-400/10',
  rp: 'border-rose-400/40 hover:bg-rose-500/10 dark:hover:bg-rose-400/10',
};
