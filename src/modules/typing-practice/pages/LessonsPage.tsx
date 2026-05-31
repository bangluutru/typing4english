import React from 'react';
import { Lock, CheckCircle2, ChevronRight, Trophy, Bookmark } from 'lucide-react';
import { lessons } from '../data/lessons';
import type { Lesson } from '../data/lessons';
import type { UserProgress } from '../stores/progressStore';
import { useTranslation } from '../../../i18n/useTranslation';

interface LessonsPageProps {
  progress: UserProgress;
  onNavigate: (page: any) => void;
  onSelectLesson: (lessonId: string) => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({
  progress,
  onNavigate,
  onSelectLesson,
}) => {
  const { completedLessons } = progress;
  const t = useTranslation();

  const isLessonUnlocked = (index: number): boolean => {
    if (index === 0) return true;
    
    const prevLesson = lessons[index - 1];
    const prevResult = completedLessons[prevLesson.id];
    
    return prevResult !== undefined && prevResult.accuracy >= 90;
  };

  const handleLessonClick = (lesson: Lesson, unlocked: boolean) => {
    if (!unlocked) return;
    onSelectLesson(lesson.id);
    onNavigate('practice');
  };

  const groupedLessons: Record<number, { name: string; list: { lesson: Lesson; unlocked: boolean; index: number }[] }> = {};

  lessons.forEach((lesson, index) => {
    const lvl = lesson.level;
    const unlocked = isLessonUnlocked(index);
    
    if (!groupedLessons[lvl]) {
      groupedLessons[lvl] = {
        name: lesson.levelName,
        list: [],
      };
    }
    groupedLessons[lvl].list.push({ lesson, unlocked, index });
  });

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-4xl select-none">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
          <Trophy className="w-7 h-7 text-amber-500 fill-amber-500/10" />
          {t('typingPractice.lessons.roadmapTitle')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          {t('typingPractice.lessons.roadmapDesc', { minAccuracy: 90 })}
        </p>
      </div>

      <div className="w-full flex flex-col gap-8 px-4 mt-2">
        {Object.entries(groupedLessons).map(([levelNum, group]) => (
          <div key={levelNum} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-tp-primary-500/10 dark:bg-tp-primary-500/20 text-tp-primary-600 dark:text-tp-primary-400 font-black flex items-center justify-center text-sm shadow-sm">
                L{levelNum}
              </span>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
                {t(`typingPractice.lessons.${group.name === 'Keyboard Basics' ? 'keyboardHomeRow' : group.name === 'Top Row' ? 'keyboardTopRow' : group.name === 'Bottom Row' ? 'keyboardBottomRow' : group.name === 'Numbers' ? 'keyboardNumbers' : 'keyboardAllKeys'}`)}
              </h3>
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.list.map(({ lesson, unlocked, index }) => {
                const result = completedLessons[lesson.id];
                const isCompleted = result !== undefined;

                return (
                  <div
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson, unlocked)}
                      className={`p-4 rounded-2xl border transition-all duration-200 relative flex justify-between items-center gap-4 ${
                        unlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:border-tp-primary-400 dark:hover:border-tp-primary-500/50 hover:shadow-md cursor-pointer hover:-translate-y-0.5'
                          : 'bg-slate-100/50 dark:bg-slate-950/30 border-slate-200/50 dark:border-slate-900/60 opacity-60'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <div className="p-1 rounded-lg bg-tp-success-500/10 text-tp-success-500">
                            <CheckCircle2 className="w-4 h-4 fill-tp-success-500/10" />
                          </div>
                        ) : !unlocked ? (
                          <div className="p-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400">
                            <Lock className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-lg bg-tp-primary-500/10 text-tp-primary-500">
                            <Bookmark className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('typingPractice.lessons.lessonNumber', { number: index + 1 })}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {t(lesson.name)}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {t('typingPractice.lessons.lessonObjective', { accuracy: lesson.minAccuracy, wpm: lesson.minWpm })}
                        </p>

                        {isCompleted && (
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-black text-tp-success-600 dark:text-success-400 bg-tp-success-500/5 px-2 py-0.5 rounded-md w-max">
                            <span>{t('typingPractice.lessons.bestResult', { wpm: result.wpm })}</span>
                            <span>•</span>
                            <span>🎯 {result.accuracy}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {unlocked && (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default LessonsPage;
