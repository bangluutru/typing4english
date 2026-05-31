import React from 'react';
import { Play, BarChart2, Settings, Zap, Target, Clock, Calendar, Award } from 'lucide-react';
import { lessons } from '../data/lessons';
import { formatTime } from '../utils/typingMetrics';
import type { UserProgress } from '../stores/progressStore';
import { useTranslation } from '../../../i18n/useTranslation';

interface HomePageProps {
  progress: UserProgress;
  onNavigate: (page: any) => void;
  onSelectLesson: (lessonId: string) => void;
}

export const TypingHomePage: React.FC<HomePageProps> = ({
  progress,
  onNavigate,
  onSelectLesson,
}) => {
  const { completedLessons, currentLessonId, totalPracticeTime, streak } = progress;
  const t = useTranslation();

  const completedCount = Object.keys(completedLessons).length;
  
  const results = Object.values(completedLessons);
  const avgAccuracy = results.length > 0
    ? Math.round(results.reduce((acc, curr) => acc + curr.accuracy, 0) / results.length)
    : 0;

  const bestWpm = results.length > 0
    ? Math.max(...results.map((r) => r.wpm))
    : 0;

  const currentLesson = lessons.find((l) => l.id === currentLessonId) || lessons[0];

  const handleStartPractice = () => {
    onSelectLesson(currentLesson.id);
    onNavigate('practice');
  };

  return (
    <div className="flex flex-col items-center gap-8 py-4 w-full max-w-4xl select-none animate-tp-pulse-slow">
      <div className="text-center flex flex-col items-center gap-3 mt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tp-primary-50 dark:bg-tp-primary-950/20 border border-tp-primary-200/40 dark:border-tp-primary-900/40 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-tp-primary-500 animate-pulse"></span>
          <span className="text-[10px] sm:text-xs font-bold text-tp-primary-600 dark:text-tp-primary-400 uppercase tracking-widest font-mono">
            {t('arcadeEducational')}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-display">
          TypeMaster <span className="text-tp-primary-500">10 Fingers</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl">
          {t('home.typingDesc')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4 max-w-xl">
        <button
          onClick={handleStartPractice}
          className="flex-1 flex justify-center items-center gap-2 bg-tp-primary-500 hover:bg-tp-primary-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>{completedCount > 0 ? t('typingPractice.home.startPractice') : t('home.startTrainingBtn')}</span>
        </button>

        <button
          onClick={() => onNavigate('lessons')}
          className="flex-1 flex justify-center items-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold py-3.5 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Award className="w-5 h-5" />
          <span>{t('typingPractice.lessons.title')}</span>
        </button>
      </div>

      <div className="w-full max-w-2xl px-4">
        <div className="tp-glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-tp-primary-500 uppercase tracking-wider">
              {t(currentLesson.levelName === 'Keyboard Basics' ? 'typingPractice.lessons.keyboardHomeRow' : currentLesson.levelName)}
            </span>
            <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
              {t(currentLesson.name)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('common.objective')}: {t(currentLesson.objective)}
            </p>
          </div>
          
          <button
            onClick={() => {
              onSelectLesson(currentLesson.id);
              onNavigate('practice');
            }}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            {t('typingPractice.home.startPractice')}
          </button>
        </div>
      </div>

      {completedCount > 0 && (
        <div className="w-full px-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 font-mono">
            {t('typingPractice.nav.dashboard')}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="tp-glass p-4 rounded-3xl flex flex-col justify-center items-center text-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-colors duration-300">
              <Calendar className="w-6 h-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                {t('typingPractice.dashboard.streak')}
              </span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {streak} {t('typingPractice.dashboard.days')}
              </span>
            </div>

            <div className="tp-glass p-4 rounded-3xl flex flex-col justify-center items-center text-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group hover:border-teal-400/40 transition-colors duration-300">
              <Zap className="w-6 h-6 text-teal-500 mb-2 group-hover:scale-110 transition-transform fill-teal-500/10" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                {t('typingPractice.dashboard.wpmRecord')}
              </span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {bestWpm} WPM
              </span>
            </div>

            <div className="tp-glass p-4 rounded-3xl flex flex-col justify-center items-center text-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group hover:border-success-400/40 transition-colors duration-300">
              <Target className="w-6 h-6 text-tp-success-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                {t('statsAccuracy')}
              </span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {avgAccuracy}%
              </span>
            </div>

            <div className="tp-glass p-4 rounded-3xl flex flex-col justify-center items-center text-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group hover:border-tp-primary-400/40 transition-colors duration-300">
              <Clock className="w-6 h-6 text-tp-primary-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                {t('common.practiceTime')}
              </span>
              <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {formatTime(totalPracticeTime)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1 hover:text-tp-primary-500 transition-colors cursor-pointer"
        >
          <BarChart2 className="w-4 h-4" />
          <span>{t('typingPractice.nav.dashboard')}</span>
        </button>
        <span>•</span>
        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-1 hover:text-tp-primary-500 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          <span>{t('navigation.settings')}</span>
        </button>
      </div>
    </div>
  );
};
export default TypingHomePage;
