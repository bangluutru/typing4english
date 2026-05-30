import React from 'react';
import { Award, TrendingUp, Calendar, Zap, AlertCircle, RefreshCw, BarChart2 } from 'lucide-react';
import { fingerMapping, fingerLabels } from '../data/fingerMapping';
import { formatTime } from '../utils/typingMetrics';
import type { UserProgress } from '../stores/progressStore';

interface ProgressDashboardProps {
  progress: UserProgress;
  onReset: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  progress,
  onReset,
}) => {
  const { completedLessons, totalPracticeTime, errorHeatmap, dailyHistory, streak } = progress;

  const completedCount = Object.keys(completedLessons).length;

  const results = Object.values(completedLessons);
  const avgAccuracy = results.length > 0
    ? Math.round(results.reduce((acc, curr) => acc + curr.accuracy, 0) / results.length)
    : 0;

  const bestWpm = results.length > 0
    ? Math.max(...results.map((r) => r.wpm))
    : 0;

  const weakKeys = Object.entries(errorHeatmap)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const renderSVGChart = () => {
    const historyEntries = Object.entries(dailyHistory)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7);

    if (historyEntries.length < 2) {
      return (
        <div className="h-32 flex flex-col justify-center items-center text-slate-400 dark:text-slate-500 text-xs gap-1 py-4">
          <BarChart2 className="w-8 h-8 opacity-40 animate-pulse" />
          <span>Luyện tập từ 2 ngày trở lên để xem biểu đồ tiến trình</span>
        </div>
      );
    }

    const wpmValues = historyEntries.map(([_, data]) => data.wpm);
    const maxVal = Math.max(...wpmValues, 40);
    const minVal = Math.min(...wpmValues, 0);

    const width = 450;
    const height = 120;
    const padding = 20;

    const getX = (index: number) => padding + (index * (width - padding * 2)) / (historyEntries.length - 1);
    const getY = (val: number) => height - padding - ((val - minVal) * (height - padding * 2)) / (maxVal - minVal || 1);

    let pathD = `M ${getX(0)} ${getY(wpmValues[0])}`;
    let fillD = `M ${getX(0)} ${height - padding} L ${getX(0)} ${getY(wpmValues[0])}`;

    for (let i = 1; i < historyEntries.length; i++) {
      pathD += ` L ${getX(i)} ${getY(wpmValues[i])}`;
      fillD += ` L ${getX(i)} ${getY(wpmValues[i])}`;
    }

    fillD += ` L ${getX(historyEntries.length - 1)} ${height - padding} Z`;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea0ea" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0ea0ea" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="0.5" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />

        <path d={fillD} fill="url(#chartGradient)" />

        <path d={pathD} fill="none" stroke="#0ea0ea" strokeWidth="3" strokeLinecap="round" />

        {wpmValues.map((val, i) => (
          <g key={i}>
            <circle cx={getX(i)} cy={getY(val)} r="4" fill="#ffffff" stroke="#0ea0ea" strokeWidth="2.5" />
            <text x={getX(i)} y={getY(val) - 8} textAnchor="middle" className="text-[10px] font-bold fill-slate-600 dark:fill-slate-400">
              {val}
            </text>
            <text x={getX(i)} y={height - 4} textAnchor="middle" className="text-[8px] font-semibold fill-slate-400">
              {historyEntries[i][0].split('-').slice(1).join('/')}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="tp-glass p-4 rounded-3xl flex items-center gap-3 border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block">Ngày học Streak</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{streak} ngày</span>
          </div>
        </div>

        <div className="tp-glass p-4 rounded-3xl flex items-center gap-3 border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-tp-primary-500/10 text-tp-primary-500">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block">Đã hoàn thành</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{completedCount} bài</span>
          </div>
        </div>

        <div className="tp-glass p-4 rounded-3xl flex items-center gap-3 border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-teal-500/10" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block">WPM Tốt nhất</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{bestWpm} WPM</span>
          </div>
        </div>

        <div className="tp-glass p-4 rounded-3xl flex items-center gap-3 border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-tp-success-500/10 text-tp-success-500">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block">Chính xác trung bình</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">{avgAccuracy}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="tp-glass p-5 rounded-3xl flex flex-col gap-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
            <h3 className="font-black text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-tp-primary-500" />
              Biểu đồ Tiến trình Tốc độ (WPM)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">7 ngày gần nhất</span>
          </div>
          
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-2 sm:p-4 rounded-2xl border border-slate-200/20 dark:border-slate-800/10">
            {renderSVGChart()}
          </div>

          <div className="flex justify-between items-center text-xs opacity-70">
            <span>Tổng thời gian học gõ: <strong>{formatTime(totalPracticeTime)}</strong></span>
            <span>Tổng số bài luyện: <strong>{Object.keys(completedLessons).length}</strong></span>
          </div>
        </div>

        <div className="tp-glass p-5 rounded-3xl flex flex-col gap-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex justify-between items-center border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
            <h3 className="font-black text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-tp-danger-500" />
              Phân tích các phím hay gõ sai nhất
            </h3>
          </div>

          {weakKeys.length > 0 ? (
            <div className="flex flex-col gap-3">
              {weakKeys.map(([key, count], index) => {
                const config = fingerMapping[key];
                const fingerName = config ? fingerLabels[config.finger] : 'Không rõ';
                
                return (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/20 dark:border-slate-800/20">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 flex justify-center items-center rounded-lg bg-danger-100 dark:bg-danger-950/40 text-tp-danger-600 dark:text-danger-400 font-bold text-xs">
                        {index + 1}
                      </span>
                      <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm font-mono font-bold text-sm sm:text-base">
                        {key === ' ' ? 'Space' : key.toUpperCase()}
                      </kbd>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {fingerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-tp-danger-500">
                      <span>{count}</span>
                      <span className="text-[10px] font-medium opacity-60">lỗi</span>
                    </div>
                  </div>
                );
              })}

              <div className="mt-2 bg-tp-primary-50 dark:bg-tp-primary-950/20 border border-tp-primary-100 dark:border-tp-primary-900/30 rounded-2xl p-3 flex gap-2">
                <span className="text-lg">💡</span>
                <p className="text-xs text-tp-primary-700 dark:text-tp-primary-300 font-medium">
                  <strong>Khuyên dùng:</strong> Hãy mở phần <strong>Cài đặt</strong> và bật chế độ bàn tay ảo <strong>(Hand Guide)</strong> để rèn luyện trí nhớ cơ, tập trung đặt tay đúng Home Row để giảm thiểu lỗi đáng kể.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 dark:text-slate-500 text-xs gap-2 py-10">
              <span className="text-3xl">🎯</span>
              <span className="font-semibold">Tuyệt vời! Bạn chưa gõ sai phím nào.</span>
              <span className="opacity-60 text-[10px]">Hãy bắt đầu luyện tập một bài học để phân tích phím gõ.</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={() => {
            if (confirm('Bạn có chắc chắn muốn RESET toàn bộ tiến trình học tập không? Dữ liệu đã xóa không thể khôi phục.')) {
              onReset();
            }
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-tp-danger-600 hover:bg-tp-danger-50 dark:text-danger-400 dark:hover:bg-danger-950/30 transition-colors border border-transparent hover:border-danger-200/40"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Xóa toàn bộ tiến trình học
        </button>
      </div>
    </div>
  );
};
export default ProgressDashboard;
