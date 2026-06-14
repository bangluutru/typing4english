import React from 'react';
import { VirtualKey } from './VirtualKey';
import { fingerMapping, shiftToBaseKey } from '../../data/fingerMapping';
import { row1Keys, row2Keys, row3Keys, row4Keys } from './keyboardLayout';

interface VirtualKeyboardProps {
  targetChar: string;
  lastPressedKey: string | null;
  lastPressedCorrect: boolean | null;
  registerKey: (key: string) => (el: HTMLElement | null) => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  targetChar,
  lastPressedKey,
  lastPressedCorrect,
  registerKey,
}) => {
  const getCleanKey = (k: string): string => {
    if (k === ' ') return 'space';
    if (k === 'Enter') return 'enter';
    if (k === 'Backspace') return 'backspace';
    return k.toLowerCase();
  };

  const cleanLastPressed = lastPressedKey ? getCleanKey(lastPressedKey) : null;

  const targetConfig = fingerMapping[targetChar] || null;
  const requiresShift = targetConfig ? targetConfig.requiresShift : false;
  const targetHand = targetConfig ? targetConfig.hand : 'left';
  // For shift characters, resolve to the physical base key (e.g., '?' → '/', 'A' → 'a')
  const targetBaseKey = requiresShift
    ? (shiftToBaseKey[targetChar] || targetChar.toLowerCase())
    : (targetConfig ? targetConfig.key : targetChar.toLowerCase());

  const checkIsTarget = (keyLabel: string): boolean => {
    const cleanLabel = keyLabel.toLowerCase();
    
    if (cleanLabel === targetBaseKey) return true;
    
    if (requiresShift) {
      if (cleanLabel === 'shift-right' && targetHand === 'left') return true;
      if (cleanLabel === 'shift-left' && targetHand === 'right') return true;
    }

    return false;
  };

  const checkIsError = (keyLabel: string): boolean => {
    if (lastPressedCorrect === true || !cleanLastPressed) return false;
    const cleanLabel = keyLabel.toLowerCase();
    return cleanLabel === cleanLastPressed;
  };

  const checkIsPressed = (keyLabel: string): boolean => {
    if (lastPressedCorrect !== true || !cleanLastPressed) return false;
    const cleanLabel = keyLabel.toLowerCase();
    return cleanLabel === cleanLastPressed;
  };

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 p-3 sm:p-4 rounded-2xl tp-glass shadow-md max-w-full overflow-x-auto select-none border border-slate-200/50 dark:border-slate-800/50">
      {/* Row 1 */}
      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {row1Keys.map((k) => (
          <VirtualKey
            key={k.key}
            keyId={k.key}
            label={k.label}
            shiftLabel={k.shiftLabel}
            finger={k.finger}
            widthClass={k.widthClass}
            isTarget={checkIsTarget(k.key)}
            isError={checkIsError(k.key)}
            isPressed={checkIsPressed(k.key)}
            registerRef={registerKey(k.key)}
          />
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {row2Keys.map((k) => (
          <VirtualKey
            key={k.key}
            keyId={k.key}
            label={k.label}
            shiftLabel={k.shiftLabel}
            finger={k.finger}
            widthClass={k.widthClass}
            isTarget={checkIsTarget(k.key)}
            isError={checkIsError(k.key)}
            isPressed={checkIsPressed(k.key)}
            registerRef={registerKey(k.key)}
          />
        ))}
      </div>

      {/* Row 3 */}
      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {row3Keys.map((k) => (
          <VirtualKey
            key={k.key}
            keyId={k.key}
            label={k.label}
            shiftLabel={k.shiftLabel}
            finger={k.finger}
            widthClass={k.widthClass}
            isTarget={checkIsTarget(k.key)}
            isError={checkIsError(k.key)}
            isPressed={checkIsPressed(k.key)}
            registerRef={registerKey(k.key)}
          />
        ))}
      </div>

      {/* Row 4 */}
      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {row4Keys.map((k) => (
          <VirtualKey
            key={k.key}
            keyId={k.key}
            label={k.label}
            shiftLabel={k.shiftLabel}
            finger={k.finger}
            widthClass={k.widthClass}
            isTarget={checkIsTarget(k.key)}
            isError={checkIsError(k.key)}
            isPressed={checkIsPressed(k.key)}
            registerRef={registerKey(k.key)}
          />
        ))}
      </div>

      {/* Row 5 - Spacebar */}
      <div className="flex gap-1 sm:gap-1.5 justify-center">
        <VirtualKey
          label="Space"
          keyId="space"
          finger="rt"
          widthClass="w-64 sm:w-80 md:w-96"
          isTarget={checkIsTarget(' ')}
          isError={checkIsError(' ')}
          isPressed={checkIsPressed(' ')}
          registerRef={registerKey('space')}
        />
      </div>
    </div>
  );
};
export default VirtualKeyboard;
