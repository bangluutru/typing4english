import React, { useEffect } from 'react';
import { RotateCcw, ArrowRight, Home, BarChart2, AlertTriangle, CheckCircle } from 'lucide-react';
import { lessons } from '../data/lessons';
import { fingerMapping, fingerLabels } from '../data/fingerMapping';
import { generateFeedback, formatTime } from '../utils/typingMetrics';

interface ResultPageProps {
  lessonId: string;
  result: {
    wpm: number;
    accuracy: number;
    timeSpent: number;
    errors: Record<string, number>;
  } | null;
  onNavigate: (page: any) => void;
  onSelectLesson: (lessonId: string) => void;
  onGoToWordBattle?: (focusKeys?: string[]) => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  lessonId,
  result,
  onNavigate,
  onSelectLesson,
  onGoToWordBattle,
}) => {
  const lesson = lessons.find((l) => l.id === lessonId) || lessons[0];

  useEffect(() => {
    if (result && result.accuracy >= 90) {
      triggerCSSConfetti();
    }
  }, [result]);

  if (!result) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-slate-400">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <span>Chưa tìm thấy kết quả luyện tập nào</span>
        <button onClick={() => onNavigate('home')} className="bg-tp-primary-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow">
          Trở về trang chủ
        </button>
      </div>
    );
  }

  const { wpm, accuracy, timeSpent, errors } = result;
  const isPassed = accuracy >= 90;

  const weakKeys = Object.entries(errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key);

  const feedback = generateFeedback(wpm, accuracy, weakKeys);

  const currentIdx = lessons.findIndex((l) => l.id === lessonId);
  const nextLesson = currentIdx !== -1 && currentIdx + 1 < lessons.length
    ? lessons[currentIdx + 1]
    : null;

  const handleNextLesson = () => {
    if (nextLesson) {
      onSelectLesson(nextLesson.id);
      onNavigate('practice');
    }
  };

  const handleRetry = () => {
    onSelectLesson(lesson.id);
    onNavigate('practice');
  };

  const triggerCSSConfetti = () => {
    const container = document.body;
    const colors = ['#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = `${Math.random() * 8 + 5}px`;
      confetti.style.height = `${Math.random() * 8 + 5}px`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = '50%';
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.top = `-10px`;
      confetti.style.zIndex = '9999';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      
      container.appendChild(confetti);

      const duration = Math.random() * 2000 + 1500;
      const animation = confetti.animate([
        { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${Math.random() * 150 - 75}px, 105vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], {
        duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });

      animation.onfinish = () => confetti.remove();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-2xl px-4 select-none relative">
      <div className="text-center flex flex-col items-center gap-3">
        {isPassed ? (
          <div className="p-4 rounded-full bg-success-100 dark:bg-success-950/40 text-tp-success-500 scale-110 drop-shadow-sm">
            <CheckCircle className="w-12 h-12 fill-success-100 dark:fill-success-950/20" />
          </div>
        ) : (
          <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 scale-110 drop-shadow-sm">
            <AlertTriangle className="w-12 h-12" />
          </div>
        )}

        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100">
          {isPassed ? 'Hoàn thành Xuất sắc!' : 'Cần cố gắng thêm một chút'}
        </h2>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
          {lesson.name}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-2">
        <div className="tp-glass p-4 rounded-2xl flex flex-col items-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tốc độ</span>
          <span className="text-2xl font-black text-tp-primary-500 mt-1">{wpm} WPM</span>
        </div>

        <div className="tp-glass p-4 rounded-2xl flex flex-col items-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chính xác</span>
          <span className="text-2xl font-black text-tp-success-500 mt-1">{accuracy}%</span>
        </div>

        <div className="tp-glass p-4 rounded-2xl flex flex-col items-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</span>
          <span className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">{formatTime(timeSpent)}</span>
        </div>

        <div className="tp-glass p-4 rounded-2xl flex flex-col items-center border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lỗi gõ</span>
          <span className="text-2xl font-black text-tp-danger-500 mt-1">{Object.values(errors).reduce((a,b)=>a+b, 0)}</span>
        </div>
      </div>

      <div className="w-full tp-glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Nhận xét thông minh từ Giáo viên ảo
        </h4>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
          {feedback}
        </p>

        {weakKeys.length > 0 && (
          <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-slate-200/40 dark:border-slate-800/40">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Các phím bạn gõ sai nhiều nhất bài này:
            </span>
            <div className="flex flex-wrap gap-2.5">
              {weakKeys.map((key) => {
                const config = fingerMapping[key];
                const label = config ? fingerLabels[config.finger] : 'Không rõ';
                return (
                  <div key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50">
                    <kbd className="font-mono font-bold text-xs bg-white dark:bg-slate-800 px-1 rounded shadow-sm border border-slate-200 dark:border-slate-700">
                      {key === ' ' ? 'Space' : key.toUpperCase()}
                    </kbd>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {onGoToWordBattle && (
        <button
          onClick={() => onGoToWordBattle(lesson.focusKeys)}
          className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-cyber-accent to-cyber-magenta text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 hover:shadow-cyber-accent/30 cursor-pointer text-xs sm:text-sm uppercase tracking-wider border border-cyber-accent/20"
        >
          <span>🎮 Luyện tập phản xạ với Game Bắn Chữ →</span>
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
        {isPassed && nextLesson ? (
          <button
            onClick={handleNextLesson}
            className="flex-1 flex justify-center items-center gap-2 bg-tp-primary-500 hover:bg-tp-primary-600 text-white font-bold py-3 px-6 rounded-2xl shadow transition-all transform hover:-translate-y-0.5"
          >
            <span>Bài tiếp theo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleRetry}
            className="flex-1 flex justify-center items-center gap-2 bg-tp-primary-500 hover:bg-tp-primary-600 text-white font-bold py-3 px-6 rounded-2xl shadow transition-all transform hover:-translate-y-0.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Luyện lại bài này</span>
          </button>
        )}

        <button
          onClick={() => onNavigate('lessons')}
          className="flex-1 flex justify-center items-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all transform hover:-translate-y-0.5"
        >
          <Home className="w-4 h-4" />
          <span>Lộ trình học</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="flex-1 flex justify-center items-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-3 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all transform hover:-translate-y-0.5"
        >
          <BarChart2 className="w-4 h-4" />
          <span>Báo cáo</span>
        </button>
      </div>
    </div>
  );
};
export default ResultPage;
