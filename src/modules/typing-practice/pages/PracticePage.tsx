import React, { useEffect } from 'react';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { lessons } from '../data/lessons';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { LessonText } from '../components/LessonText';
import { StatsPanel } from '../components/StatsPanel';
import { KeyboardPracticeStage } from '../components/typing/KeyboardPracticeStage';
import type { TypingPracticeSettings } from '../stores/settingsStore';
import { useTranslation } from '../../../i18n/useTranslation';

interface PracticePageProps {
  lessonId: string;
  settings: TypingPracticeSettings;
  onNavigate: (page: any) => void;
  onLessonComplete: (wpm: number, accuracy: number, timeSpent: number, errors: Record<string, number>) => void;
}

export const PracticePage: React.FC<PracticePageProps> = ({
  lessonId,
  settings,
  onNavigate,
  onLessonComplete,
}) => {
  const lesson = lessons.find((l) => l.id === lessonId) || lessons[0];
  const t = useTranslation();

  const {
    currentIndex,
    charStatuses,
    elapsedTime,
    wpm,
    accuracy,
    isCompleted,
    errorStats,
    lastPressedKey,
    lastPressedCorrect,
    resetKeyFlash,
  } = useTypingEngine({
    text: lesson.text,
    soundEnabled: settings.soundEnabled,
    backspaceEnabled: settings.backspaceEnabled,
    active: true,
  });

  useEffect(() => {
    if (isCompleted) {
      onLessonComplete(wpm, accuracy, elapsedTime, errorStats);
      onNavigate('result');
    }
  }, [isCompleted, wpm, accuracy, elapsedTime, errorStats, onLessonComplete, onNavigate]);

  const targetChar = lesson.text[currentIndex] || '';

  useEffect(() => {
    if (lastPressedKey) {
      const setTimeoutId = setTimeout(() => {
        resetKeyFlash();
      }, 150);
      return () => clearTimeout(setTimeoutId);
    }
  }, [lastPressedKey, resetKeyFlash]);

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-4xl py-2 px-4 select-none">
      {/* Top Header Row with Navigation */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={() => onNavigate('lessons')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t('typingPractice.practice.backToMap')}</span>
        </button>

        <div className="text-center flex flex-col">
          <span className="text-[10px] font-bold text-tp-primary-500 uppercase tracking-widest leading-none">
            {t(`typingPractice.lessons.${lesson.levelName === 'Keyboard Basics' ? 'keyboardHomeRow' : lesson.levelName === 'Top Row' ? 'keyboardTopRow' : lesson.levelName === 'Bottom Row' ? 'keyboardBottomRow' : lesson.levelName === 'Numbers' ? 'keyboardNumbers' : 'keyboardAllKeys'}`)}
          </span>
          <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 mt-1">
            {t(lesson.name)}
          </h2>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('typingPractice.practice.retryFromStart')}</span>
        </button>
      </div>

      {/* Stats Dashboard */}
      <StatsPanel
        wpm={wpm}
        accuracy={accuracy}
        errorCount={Object.values(errorStats).reduce((a, b) => a + b, 0)}
        elapsedTime={elapsedTime}
        currentIndex={currentIndex}
        totalLength={lesson.text.length}
      />

      {/* Main text box display */}
      <LessonText
        text={lesson.text}
        currentIndex={currentIndex}
        charStatuses={charStatuses}
        fontSize={settings.fontSize}
        lastPressedCorrect={lastPressedCorrect}
      />

      {/* Unified Coordinate Practice Stage (Keyboard + Hands Overlay) */}
      <div className="w-full mt-2">
        <KeyboardPracticeStage
          targetChar={targetChar}
          lastPressedKey={lastPressedKey}
          lastPressedCorrect={lastPressedCorrect}
          showHands={settings.handsEnabled}
        />
      </div>
    </div>
  );
};
export default PracticePage;
