import React from 'react';
import { Zap, Target, AlertCircle, Clock } from 'lucide-react';
import { formatTime } from '../utils/typingMetrics';

interface StatsPanelProps {
  wpm: number;
  accuracy: number;
  errorCount: number;
  elapsedTime: number;
  currentIndex: number;
  totalLength: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  wpm,
  accuracy,
  errorCount,
  elapsedTime,
  currentIndex,
  totalLength,
}) => {
  const completionPercent = Math.min(100, Math.round((currentIndex / totalLength) * 100));

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Progress Bar with Percentage */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-tp-primary-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 min-w-[2.5rem] text-right">
          {completionPercent}%
        </span>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {/* WPM Card */}
        <div className="tp-glass p-3 rounded-2xl flex flex-col justify-center items-center gap-1 text-center shadow-sm border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5 text-tp-primary-500">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-tp-primary-100 dark:fill-tp-primary-900/30" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-60">WPM</span>
          </div>
          <span className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100">
            {wpm}
          </span>
        </div>

        {/* Accuracy Card */}
        <div className="tp-glass p-3 rounded-2xl flex flex-col justify-center items-center gap-1 text-center shadow-sm border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5 text-tp-success-500">
            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-60">Chính xác</span>
          </div>
          <span className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100">
            {accuracy}%
          </span>
        </div>

        {/* Errors Card */}
        <div className="tp-glass p-3 rounded-2xl flex flex-col justify-center items-center gap-1 text-center shadow-sm border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5 text-tp-danger-500">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-60">Lỗi gõ</span>
          </div>
          <span className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100">
            {errorCount}
          </span>
        </div>

        {/* Time Card */}
        <div className="tp-glass p-3 rounded-2xl flex flex-col justify-center items-center gap-1 text-center shadow-sm border border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider opacity-60">Thời gian</span>
          </div>
          <span className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100">
            {formatTime(elapsedTime)}
          </span>
        </div>
      </div>
    </div>
  );
};
export default StatsPanel;
