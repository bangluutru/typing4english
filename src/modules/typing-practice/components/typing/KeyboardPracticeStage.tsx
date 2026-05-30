import React, { useRef } from 'react';
import { VirtualKeyboard } from './VirtualKeyboard';
import { HandOverlay } from './HandOverlay';
import { useKeyboardGeometry } from './useKeyboardGeometry';
import { fingerMapping, fingerLabels } from '../../data/fingerMapping';

interface KeyboardPracticeStageProps {
  targetChar: string;
  lastPressedKey: string | null;
  lastPressedCorrect: boolean | null;
  showHands: boolean;
}

export const KeyboardPracticeStage: React.FC<KeyboardPracticeStageProps> = ({
  targetChar,
  lastPressedKey,
  lastPressedCorrect,
  showHands,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  
  // Call geometry measurement hook
  const { geometry, registerKey } = useKeyboardGeometry(stageRef);

  // Generate friendly Vietnamese typing instructions dynamically from mapping
  const getInstructionText = (): string => {
    const config = fingerMapping[targetChar];
    if (!config) return `Gõ phím "${targetChar}" trên bàn phím`;

    const { finger, requiresShift, hand } = config;
    const label = fingerLabels[finger];
    const displayChar = targetChar === ' ' ? 'dấu cách [Spacebar]' : `phím "${targetChar.toUpperCase()}"`;

    if (requiresShift) {
      const oppositeShift = hand === 'left' ? 'Shift phải (phải út)' : 'Shift trái (trái út)';
      return `Giữ phím ${oppositeShift}, và dùng ${label.toLowerCase()} gõ ${displayChar}`;
    }

    return `Dùng ${label.toLowerCase()} gõ ${displayChar}`;
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      
      {/* 1. Dynamic Text Instructions bar */}
      <div className="bg-tp-primary-50 dark:bg-tp-primary-950/20 border border-tp-primary-200/40 dark:border-tp-primary-900/40 rounded-2xl px-5 py-3 text-center w-full shadow-sm flex items-center justify-center gap-2">
        <span className="text-base sm:text-lg animate-bounce-light">💡</span>
        <p className="text-xs sm:text-sm font-semibold text-tp-primary-700 dark:text-tp-primary-300">
          Hướng dẫn đặt ngón: <span className="underline decoration-2 decoration-tp-primary-400 font-bold">{getInstructionText()}</span>
        </p>
      </div>

      {/* 2. Practice stage containing keyboard and hands overlay */}
      <div
        ref={stageRef}
        className="relative w-full pb-14 bg-slate-50/20 dark:bg-slate-950/10 rounded-3xl border border-slate-200/30 dark:border-slate-800/20 px-2 pt-4 flex flex-col items-center overflow-visible"
      >
        {/* Virtual Keyboard is always rendered */}
        <VirtualKeyboard
          targetChar={targetChar}
          lastPressedKey={lastPressedKey}
          lastPressedCorrect={lastPressedCorrect}
          registerKey={registerKey}
        />

        {/* Hand Overlay is layered directly on top of the keyboard if enabled */}
        {showHands && (
          <HandOverlay
            geometry={geometry}
            targetChar={targetChar}
            lastPressedKey={lastPressedKey}
            lastPressedCorrect={lastPressedCorrect}
          />
        )}
      </div>
    </div>
  );
};
export default KeyboardPracticeStage;
