import type { FingerId } from '../../types/game';

export interface FingerMetadata {
  id: FingerId;
  hand: 'left' | 'right';
  nameKey: string; // key for translations
  homeKey: string;
  shortLabel: string;
  colorClass: string;
  glowClass: string;
}

export const FINGER_METADATA: Record<FingerId, FingerMetadata> = {
  'left-pinky': {
    id: 'left-pinky',
    hand: 'left',
    nameKey: 'leftPinky',
    homeKey: 'A',
    shortLabel: 'LP',
    colorClass: 'rose-500',
    glowClass: 'border-rose-500 text-white bg-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.8)]',
  },
  'left-ring': {
    id: 'left-ring',
    hand: 'left',
    nameKey: 'leftRing',
    homeKey: 'S',
    shortLabel: 'LR',
    colorClass: 'orange-500',
    glowClass: 'border-orange-500 text-white bg-orange-500/20 shadow-[0_0_12px_rgba(249,115,22,0.8)]',
  },
  'left-middle': {
    id: 'left-middle',
    hand: 'left',
    nameKey: 'leftMiddle',
    homeKey: 'D',
    shortLabel: 'LM',
    colorClass: 'amber-500',
    glowClass: 'border-amber-500 text-white bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
  },
  'left-index': {
    id: 'left-index',
    hand: 'left',
    nameKey: 'leftIndex',
    homeKey: 'F',
    shortLabel: 'LI',
    colorClass: 'emerald-500',
    glowClass: 'border-emerald-500 text-white bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.8)]',
  },
  'left-thumb': {
    id: 'left-thumb',
    hand: 'left',
    nameKey: 'leftThumb',
    homeKey: 'Space',
    shortLabel: 'LT',
    colorClass: 'cyber-accent',
    glowClass: 'border-cyber-accent text-white bg-cyber-accent/30 shadow-[0_0_12px_rgba(0,243,255,0.8)]',
  },
  'right-thumb': {
    id: 'right-thumb',
    hand: 'right',
    nameKey: 'rightThumb',
    homeKey: 'Space',
    shortLabel: 'RT',
    colorClass: 'cyber-accent',
    glowClass: 'border-cyber-accent text-white bg-cyber-accent/30 shadow-[0_0_12px_rgba(0,243,255,0.8)]',
  },
  'right-index': {
    id: 'right-index',
    hand: 'right',
    nameKey: 'rightIndex',
    homeKey: 'J',
    shortLabel: 'RI',
    colorClass: 'teal-500',
    glowClass: 'border-teal-500 text-white bg-teal-500/20 shadow-[0_0_12px_rgba(20,184,166,0.8)]',
  },
  'right-middle': {
    id: 'right-middle',
    hand: 'right',
    nameKey: 'rightMiddle',
    homeKey: 'K',
    shortLabel: 'RM',
    colorClass: 'sky-500',
    glowClass: 'border-sky-500 text-white bg-sky-500/20 shadow-[0_0_12px_rgba(14,165,233,0.8)]',
  },
  'right-ring': {
    id: 'right-ring',
    hand: 'right',
    nameKey: 'rightRing',
    homeKey: 'L',
    shortLabel: 'RR',
    colorClass: 'indigo-500',
    glowClass: 'border-indigo-500 text-white bg-indigo-500/20 shadow-[0_0_12px_rgba(79,70,229,0.8)]',
  },
  'right-pinky': {
    id: 'right-pinky',
    hand: 'right',
    nameKey: 'rightPinky',
    homeKey: ';',
    shortLabel: 'RP',
    colorClass: 'fuchsia-500',
    glowClass: 'border-fuchsia-500 text-white bg-fuchsia-500/20 shadow-[0_0_12px_rgba(217,70,239,0.8)]',
  },
};
