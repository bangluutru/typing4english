import React from 'react';
import type { FingerId } from '../../types/game';
import { getKeyDefinition } from '../data/keyboardLayout';
import { FINGER_METADATA } from '../data/fingerMetadata';

interface VirtualKeyboardProps {
  currentKey: string | null;
  showHomeRowHint: boolean;
}

// Map each FingerId to customized inactive premium color classes
const FINGER_INACTIVE_COLORS: Record<FingerId, string> = {
  'left-pinky': 'border-rose-500/25 text-rose-300 bg-rose-950/10',
  'left-ring': 'border-orange-500/25 text-orange-300 bg-orange-950/10',
  'left-middle': 'border-amber-500/25 text-amber-300 bg-amber-950/10',
  'left-index': 'border-emerald-500/25 text-emerald-300 bg-emerald-950/10',
  'left-thumb': 'border-cyber-accent/25 text-cyber-accent bg-cyber-accent/5',
  'right-thumb': 'border-cyber-accent/25 text-cyber-accent bg-cyber-accent/5',
  'right-index': 'border-teal-500/25 text-teal-300 bg-teal-950/10',
  'right-middle': 'border-sky-500/25 text-sky-300 bg-sky-950/10',
  'right-ring': 'border-indigo-500/25 text-indigo-300 bg-indigo-950/10',
  'right-pinky': 'border-fuchsia-500/25 text-fuchsia-300 bg-fuchsia-950/10',
};

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '-'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\''],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
  [' '] // Space bar
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = React.memo(({ currentKey, showHomeRowHint }) => {
  const normalizedActiveKey = currentKey ? currentKey.toLowerCase() : null;

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-cyber-dark/45 border border-cyber-accent/10 backdrop-blur-md select-none font-mono">
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-1">
          {row.map(char => {
            const def = getKeyDefinition(char);
            if (!def) return null;

            const isTarget = normalizedActiveKey === char;
            const meta = FINGER_METADATA[def.finger];
            const inactiveColors = FINGER_INACTIVE_COLORS[def.finger];
            
            // Standard letter sizing vs Spacebar sizing
            const isSpace = char === ' ';
            const keySizeClass = isSpace 
              ? 'w-48 h-8 px-4 text-[10px] uppercase font-bold tracking-widest' 
              : 'w-7.5 h-7.5 md:w-8.5 md:h-8.5 text-[11px] md:text-[12px] font-bold';

            // Home row physical index notches on F and J
            const hasIndexNotch = showHomeRowHint && (char === 'f' || char === 'j');
            // Home row highlighted outline
            const isHomeKey = showHomeRowHint && def.isHomeKey;

            return (
              <div
                key={char}
                className={`relative flex items-center justify-center rounded-lg border transition-all duration-150 ${keySizeClass} ${
                  isTarget
                    ? `${meta.glowClass} scale-[1.05]`
                    : `${inactiveColors} ${
                        isHomeKey 
                          ? 'border-dashed border-cyber-accent/30 bg-cyber-accent/5' 
                          : 'hover:border-cyber-accent/30 hover:bg-cyber-accent/5'
                      }`
                }`}
              >
                {/* Physical index touch bump notch */}
                {hasIndexNotch && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-[1.5px] bg-cyber-accent opacity-65 rounded-full" />
                )}

                {/* Visual Label */}
                <span>{def.display}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

VirtualKeyboard.displayName = 'VirtualKeyboard';
