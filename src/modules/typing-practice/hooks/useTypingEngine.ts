import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateWPM, calculateAccuracy } from '../utils/typingMetrics';
import { playClickSound, playErrorSound } from '../utils/sound';

export type CharStatus = 'correct' | 'incorrect' | 'pending';

export interface UseTypingEngineProps {
  text: string;
  soundEnabled: boolean;
  backspaceEnabled: boolean;
  active: boolean; // Only listen to keys when active
}

export const useTypingEngine = ({
  text,
  soundEnabled,
  backspaceEnabled,
  active,
}: UseTypingEngineProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charStatuses, setCharStatuses] = useState<CharStatus[]>(() =>
    new Array(text.length).fill('pending')
  );
  
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);
  const [lastPressedCorrect, setLastPressedCorrect] = useState<boolean | null>(null);

  // Stats
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const errorStatsRef = useRef<Record<string, number>>({});
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null); // Use any to avoid NodeJS vs Browser compilation issues

  // Reset engine when text changes
  useEffect(() => {
    setCurrentIndex(0);
    setCharStatuses(new Array(text.length).fill('pending'));
    setCorrectKeystrokes(0);
    setTotalKeystrokes(0);
    setElapsedTime(0);
    setIsStarted(false);
    setIsCompleted(false);
    setWpm(0);
    setAccuracy(100);
    setLastPressedKey(null);
    setLastPressedCorrect(null);
    errorStatsRef.current = {};
    startTimeRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  }, [text]);

  // Handle timer
  useEffect(() => {
    if (isStarted && !isCompleted && active) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const nextTime = prev + 1;
          setWpm(calculateWPM(correctKeystrokes, startTimeRef.current));
          return nextTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isCompleted, correctKeystrokes, active]);

  // Realtime accuracy update
  useEffect(() => {
    setAccuracy(calculateAccuracy(correctKeystrokes, totalKeystrokes));
  }, [correctKeystrokes, totalKeystrokes]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active || isCompleted) return;

      const key = e.key;

      if (
        key === 'Shift' ||
        key === 'Control' ||
        key === 'Alt' ||
        key === 'Meta' ||
        key === 'CapsLock' ||
        key === 'Escape' ||
        key.startsWith('F') && key.length > 1
      ) {
        return;
      }

      if (key === ' ' || key === 'Tab') {
        e.preventDefault();
      }

      if (!isStarted) {
        setIsStarted(true);
        startTimeRef.current = Date.now();
      }

      const expectedChar = text[currentIndex];

      if (key === 'Backspace') {
        if (!backspaceEnabled || currentIndex === 0) return;

        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCharStatuses((prev) => {
          const next = [...prev];
          next[prevIndex] = 'pending';
          return next;
        });
        setLastPressedKey('backspace');
        setLastPressedCorrect(true);
        return;
      }

      if (key === expectedChar) {
        setCharStatuses((prev) => {
          const next = [...prev];
          next[currentIndex] = 'correct';
          return next;
        });
        
        setCorrectKeystrokes((c) => c + 1);
        setTotalKeystrokes((t) => t + 1);
        setLastPressedKey(key);
        setLastPressedCorrect(true);
        
        if (soundEnabled) playClickSound();

        const nextIndex = currentIndex + 1;
        if (nextIndex >= text.length) {
          setIsCompleted(true);
          setWpm(calculateWPM(correctKeystrokes + 1, startTimeRef.current));
        } else {
          setCurrentIndex(nextIndex);
        }
      } 
      else {
        setCharStatuses((prev) => {
          const next = [...prev];
          next[currentIndex] = 'incorrect';
          return next;
        });

        setTotalKeystrokes((t) => t + 1);
        setLastPressedKey(key);
        setLastPressedCorrect(false);

        errorStatsRef.current[expectedChar] = (errorStatsRef.current[expectedChar] || 0) + 1;

        if (soundEnabled) playErrorSound();

        if (!backspaceEnabled) {
          const nextIndex = currentIndex + 1;
          if (nextIndex >= text.length) {
            setIsCompleted(true);
            setWpm(calculateWPM(correctKeystrokes, startTimeRef.current));
          } else {
            setCurrentIndex(nextIndex);
          }
        }
      }
    },
    [text, currentIndex, isStarted, isCompleted, active, backspaceEnabled, soundEnabled, correctKeystrokes]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    currentIndex,
    charStatuses,
    correctKeystrokes,
    totalKeystrokes,
    elapsedTime,
    wpm,
    accuracy,
    isStarted,
    isCompleted,
    errorStats: errorStatsRef.current,
    lastPressedKey,
    lastPressedCorrect,
    resetKeyFlash: () => {
      setLastPressedKey(null);
      setLastPressedCorrect(null);
    }
  };
};
export default useTypingEngine;
