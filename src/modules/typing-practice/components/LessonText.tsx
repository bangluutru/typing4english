import React, { useEffect, useRef } from 'react';
import type { CharStatus } from '../hooks/useTypingEngine';
import type { FontSize } from '../stores/settingsStore';

interface LessonTextProps {
  text: string;
  currentIndex: number;
  charStatuses: CharStatus[];
  fontSize: FontSize;
  lastPressedCorrect: boolean | null;
}

export const LessonText: React.FC<LessonTextProps> = ({
  text,
  currentIndex,
  charStatuses,
  fontSize,
  lastPressedCorrect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCharRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (activeCharRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeCharRef.current;

      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elemTop = element.offsetTop - container.offsetTop;
      const elemBottom = elemTop + element.clientHeight;

      if (elemTop < containerTop + 20) {
        container.scrollTo({ top: elemTop - 20, behavior: 'smooth' });
      } else if (elemBottom > containerBottom - 20) {
        container.scrollTo({ top: elemBottom - container.clientHeight + 40, behavior: 'smooth' });
      }
    }
  }, [currentIndex]);

  const getFontSizeClass = (size: FontSize) => {
    switch (size) {
      case 'sm':
        return 'text-base sm:text-lg leading-relaxed';
      case 'md':
        return 'text-lg sm:text-xl leading-relaxed';
      case 'lg':
        return 'text-xl sm:text-2xl leading-relaxed';
      case 'xl':
        return 'text-2xl sm:text-3xl leading-relaxed';
      default:
        return 'text-xl sm:text-2xl leading-relaxed';
    }
  };

  const shakeClass = lastPressedCorrect === false ? 'animate-shake' : '';

  return (
    <div
      ref={containerRef}
      className={`w-full max-h-40 sm:max-h-48 overflow-y-auto px-6 py-5 rounded-2xl tp-glass border border-slate-200/40 dark:border-slate-800/40 shadow-inner select-none font-mono ${shakeClass} transition-transform duration-100`}
    >
      <div className={`${getFontSizeClass(fontSize)} font-medium flex flex-wrap tracking-wide text-justify`}>
        {text.split('').map((char, index) => {
          const status = charStatuses[index];
          const isActive = index === currentIndex;
          
          let charClass = 'text-slate-400 dark:text-slate-600 transition-colors duration-150';
          
          if (status === 'correct') {
            charClass = 'text-tp-success-600 dark:text-tp-success-500 font-semibold';
          } else if (status === 'incorrect') {
            charClass = 'text-tp-danger-600 dark:text-tp-danger-500 bg-tp-danger-50 dark:bg-danger-950/20 font-semibold';
          }

          if (isActive) {
            charClass = `bg-tp-primary-100 dark:bg-tp-primary-950/40 text-tp-primary-700 dark:text-tp-primary-300 px-0.5 rounded shadow-sm relative ring-2 ring-tp-primary-400/40 font-bold ${
              status === 'incorrect' ? 'bg-danger-100 text-danger-700 ring-danger-400/40' : ''
            }`;
          }

          return (
            <span
              key={index}
              ref={isActive ? activeCharRef : null}
              className={`inline-block ${charClass} whitespace-pre-wrap`}
            >
              {char === ' ' && isActive ? (
                <span className="opacity-40 font-sans text-xs">␣</span>
              ) : (
                char
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};
export default LessonText;
