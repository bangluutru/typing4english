import React from 'react';
import { getKeyDefinition } from '../data/keyboardLayout';
import { FINGER_METADATA } from '../data/fingerMetadata';

interface KeyLocatorProps {
  currentKey: string | null;
}

const LOCATOR_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ','],
  [' '] // Space bar
];

export const KeyLocator: React.FC<KeyLocatorProps> = React.memo(({ currentKey }) => {
  const normalizedActiveKey = currentKey ? currentKey.toLowerCase() : null;

  return (
    <div className="flex flex-col gap-1 p-2 rounded-xl bg-cyber-dark/30 border border-cyber-accent/5 backdrop-blur-sm select-none font-mono w-full max-w-[300px] mx-auto pointer-events-none">
      {LOCATOR_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center gap-0.5">
          {row.map(char => {
            const def = getKeyDefinition(char);
            if (!def) return null;

            const isTarget = normalizedActiveKey === char;
            const meta = FINGER_METADATA[def.finger];

            const isSpace = char === ' ';
            const keySizeClass = isSpace
              ? 'w-24 h-5 text-[8px] uppercase tracking-wider'
              : 'w-5 h-5 text-[9px]';

            return (
              <div
                key={char}
                className={`flex items-center justify-center rounded border text-center transition-all duration-150 ${keySizeClass} ${
                  isTarget
                    ? `${meta.glowClass} scale-[1.05] z-10`
                    : 'border-cyber-accent/5 text-gray-600 bg-transparent opacity-30'
                }`}
              >
                <span>{def.display}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

KeyLocator.displayName = 'KeyLocator';
