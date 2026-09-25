import { LESSONS, isUnlocked, type Lesson } from './curriculum';
import { MASTERED_BOX, todayNum, type Progress, type UiLang } from './store';
import { GRADE_INFO, type Word } from './vocab';
import type { TKey } from './i18n';

/* Derived learning state shared by several pages. */

export function lessonLabel(l: Lesson, s: (k: TKey, v?: Record<string, string | number>) => string, lang: UiLang): string {
  if (l.kind === 'keys') return l.newKeys.map(k => k.toUpperCase()).join(' ');
  if (l.kind === 'shift') return l.newKeys.length ? l.newKeys.join(' ') : 'Shift';
  if (l.kind === 'words') return s('lesson.words');
  return s('lesson.sentences', { grade: GRADE_INFO[l.grade ?? '5'][lang] });
}

/** First unlocked lesson without a star: where the child should continue. */
export function nextLessonIndex(stars: (id: string) => number) {
  const i = LESSONS.findIndex((l, idx) => isUnlocked(idx, stars) && stars(l.id) === 0);
  return i === -1 ? LESSONS.length - 1 : i;
}

export const learnedIn = (words: Word[], p: Progress) => words.filter(w => (p.words[w.id]?.box ?? 0) >= 1).length;
export const dueWords = (words: Word[], p: Progress) => {
  const today = todayNum();
  return words.filter(w => { const r = p.words[w.id]; return !!r && r.due <= today; });
};

/** 0–3 stars for a study set: how many of its words are remembered. */
export function setStars(set: Word[], p: Progress) {
  const boxes = set.map(w => p.words[w.id]?.box ?? 0);
  if (boxes.every(b => b >= MASTERED_BOX)) return 3;
  if (boxes.every(b => b >= 2)) return 2;
  if (boxes.filter(b => b >= 1).length >= Math.ceil(set.length * 0.75)) return 1;
  return 0;
}

