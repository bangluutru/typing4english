import type { FingerType } from '../../data/fingerMapping';

export interface KeyboardKey {
  key: string;
  label: string;
  shiftLabel?: string;
  finger: FingerType;
  widthClass?: string;
}

export const row1Keys: KeyboardKey[] = [
  { label: '`', shiftLabel: '~', key: '`', finger: 'lp' },
  { label: '1', shiftLabel: '!', key: '1', finger: 'lp' },
  { label: '2', shiftLabel: '@', key: '2', finger: 'lr' },
  { label: '3', shiftLabel: '#', key: '3', finger: 'lm' },
  { label: '4', shiftLabel: '$', key: '4', finger: 'li' },
  { label: '5', shiftLabel: '%', key: '5', finger: 'li' },
  { label: '6', shiftLabel: '^', key: '6', finger: 'ri' },
  { label: '7', shiftLabel: '&', key: '7', finger: 'ri' },
  { label: '8', shiftLabel: '*', key: '8', finger: 'rm' },
  { label: '9', shiftLabel: '(', key: '9', finger: 'rr' },
  { label: '0', shiftLabel: ')', key: '0', finger: 'rp' },
  { label: '-', shiftLabel: '_', key: '-', finger: 'rp' },
  { label: '=', shiftLabel: '+', key: '=', finger: 'rp' },
  { label: 'Backspace', key: 'backspace', finger: 'rp', widthClass: 'w-16 sm:w-20 md:w-24 flex-1' },
];

export const row2Keys: KeyboardKey[] = [
  { label: 'Tab', key: 'tab', finger: 'lp', widthClass: 'w-12 sm:w-14 md:w-16' },
  { label: 'Q', key: 'q', finger: 'lp' },
  { label: 'W', key: 'w', finger: 'lr' },
  { label: 'E', key: 'e', finger: 'lm' },
  { label: 'R', key: 'r', finger: 'li' },
  { label: 'T', key: 't', finger: 'li' },
  { label: 'Y', key: 'y', finger: 'ri' },
  { label: 'U', key: 'u', finger: 'ri' },
  { label: 'I', key: 'i', finger: 'rm' },
  { label: 'O', key: 'o', finger: 'rr' },
  { label: 'P', key: 'p', finger: 'rp' },
  { label: '[', shiftLabel: '{', key: '[', finger: 'rp' },
  { label: ']', shiftLabel: '}', key: ']', finger: 'rp' },
  { label: '\\', shiftLabel: '|', key: '\\', finger: 'rp', widthClass: 'w-10 sm:w-12 md:w-14 flex-1' },
];

export const row3Keys: KeyboardKey[] = [
  { label: 'Caps', key: 'capslock', finger: 'lp', widthClass: 'w-14 sm:w-16 md:w-20' },
  { label: 'A', key: 'a', finger: 'lp' },
  { label: 'S', key: 's', finger: 'lr' },
  { label: 'D', key: 'd', finger: 'lm' },
  { label: 'F', key: 'f', finger: 'li' },
  { label: 'G', key: 'g', finger: 'li' },
  { label: 'H', key: 'h', finger: 'ri' },
  { label: 'J', key: 'j', finger: 'ri' },
  { label: 'K', key: 'k', finger: 'rm' },
  { label: 'L', key: 'l', finger: 'rr' },
  { label: ';', shiftLabel: ':', key: ';', finger: 'rp' },
  { label: "'", shiftLabel: '"', key: "'", finger: 'rp' },
  { label: 'Enter', key: 'enter', finger: 'rp', widthClass: 'w-16 sm:w-20 md:w-24 flex-1' },
];

export const row4Keys: KeyboardKey[] = [
  { label: 'Shift', key: 'shift-left', finger: 'lp', widthClass: 'w-16 sm:w-20 md:w-24' },
  { label: 'Z', key: 'z', finger: 'lp' },
  { label: 'X', key: 'x', finger: 'lr' },
  { label: 'C', key: 'c', finger: 'lm' },
  { label: 'V', key: 'v', finger: 'li' },
  { label: 'B', key: 'b', finger: 'li' },
  { label: 'N', key: 'n', finger: 'ri' },
  { label: 'M', key: 'm', finger: 'ri' },
  { label: ',', shiftLabel: '<', key: ',', finger: 'rm' },
  { label: '.', shiftLabel: '>', key: '.', finger: 'rr' },
  { label: '/', shiftLabel: '?', key: '/', finger: 'rp' },
  { label: 'Shift', key: 'shift-right', finger: 'rp', widthClass: 'w-20 sm:w-24 md:w-28 flex-1' },
];
