import type { FingerId } from '../../types/game';

export interface KeyDefinition {
  key: string; // lowercase representation
  display: string; // visual uppercase/symbol representation
  row: 'number' | 'top' | 'home' | 'bottom' | 'space';
  finger: FingerId;
  isHomeKey?: boolean;
}

export const QWERTY_LAYOUT: KeyDefinition[] = [
  // Row 1 (Top letter row): Q W E R T Y U I O P
  { key: 'q', display: 'Q', row: 'top', finger: 'left-pinky' },
  { key: 'w', display: 'W', row: 'top', finger: 'left-ring' },
  { key: 'e', display: 'E', row: 'top', finger: 'left-middle' },
  { key: 'r', display: 'R', row: 'top', finger: 'left-index' },
  { key: 't', display: 'T', row: 'top', finger: 'left-index' },
  { key: 'y', display: 'Y', row: 'top', finger: 'right-index' },
  { key: 'u', display: 'U', row: 'top', finger: 'right-index' },
  { key: 'i', display: 'I', row: 'top', finger: 'right-middle' },
  { key: 'o', display: 'O', row: 'top', finger: 'right-ring' },
  { key: 'p', display: 'P', row: 'top', finger: 'right-pinky' },

  // Row 2 (Home letter row): A S D F G H J K L ;
  { key: 'a', display: 'A', row: 'home', finger: 'left-pinky', isHomeKey: true },
  { key: 's', display: 'S', row: 'home', finger: 'left-ring', isHomeKey: true },
  { key: 'd', display: 'D', row: 'home', finger: 'left-middle', isHomeKey: true },
  { key: 'f', display: 'F', row: 'home', finger: 'left-index', isHomeKey: true },
  { key: 'g', display: 'G', row: 'home', finger: 'left-index' },
  { key: 'h', display: 'H', row: 'home', finger: 'right-index' },
  { key: 'j', display: 'J', row: 'home', finger: 'right-index', isHomeKey: true },
  { key: 'k', display: 'K', row: 'home', finger: 'right-middle', isHomeKey: true },
  { key: 'l', display: 'L', row: 'home', finger: 'right-ring', isHomeKey: true },
  { key: ';', display: ';', row: 'home', finger: 'right-pinky', isHomeKey: true },

  // Row 3 (Bottom letter row): Z X C V B N M
  { key: 'z', display: 'Z', row: 'bottom', finger: 'left-pinky' },
  { key: 'x', display: 'X', row: 'bottom', finger: 'left-ring' },
  { key: 'c', display: 'C', row: 'bottom', finger: 'left-middle' },
  { key: 'v', display: 'V', row: 'bottom', finger: 'left-index' },
  { key: 'b', display: 'B', row: 'bottom', finger: 'left-index' },
  { key: 'n', display: 'N', row: 'bottom', finger: 'right-index' },
  { key: 'm', display: 'M', row: 'bottom', finger: 'right-index' },
  { key: ',', display: ',', row: 'bottom', finger: 'right-middle' },
  { key: '.', display: '.', row: 'bottom', finger: 'right-ring' },
  { key: '/', display: '/', row: 'bottom', finger: 'right-pinky' },

  // Space row
  { key: ' ', display: 'Space', row: 'space', finger: 'right-thumb' },

  // Additional phrase support punctuation
  { key: '-', display: '-', row: 'top', finger: 'right-pinky' },
  { key: '\'', display: '\'', row: 'home', finger: 'right-pinky' },
];

export const getKeyDefinition = (char: string): KeyDefinition | undefined => {
  const normalized = char.toLowerCase();
  return QWERTY_LAYOUT.find(k => k.key === normalized);
};
