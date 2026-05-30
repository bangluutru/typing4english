import { useSyncExternalStore } from 'react';

export interface LessonResult {
  wpm: number;
  accuracy: number;
  completedAt: string;
}

export interface DailyStat {
  wpm: number;
  accuracy: number;
  timeSpent: number; // in seconds
  lessonCount: number;
}

export interface UserProgress {
  completedLessons: Record<string, LessonResult>;
  currentLessonId: string;
  totalPracticeTime: number; // in seconds
  errorHeatmap: Record<string, number>;
  dailyHistory: Record<string, DailyStat>; // key: YYYY-MM-DD
  streak: number;
  lastPracticedDate: string | null; // YYYY-MM-DD
}

const DEFAULT_PROGRESS: UserProgress = {
  completedLessons: {},
  currentLessonId: 'l1-1',
  totalPracticeTime: 0,
  errorHeatmap: {},
  dailyHistory: {},
  streak: 0,
  lastPracticedDate: null,
};

const LOCAL_STORAGE_KEY = 'typing_adventure_typing_progress';
const OLD_LOCAL_STORAGE_KEY = 'typemaster_progress';

// Run migration if needed
try {
  if (typeof window !== 'undefined') {
    const oldVal = localStorage.getItem(OLD_LOCAL_STORAGE_KEY);
    const newVal = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (oldVal && !newVal) {
      localStorage.setItem(LOCAL_STORAGE_KEY, oldVal);
    }
  }
} catch (e) {
  console.error('Failed to migrate typemaster progress', e);
}

const progressStoreSetup = () => {
  let state = DEFAULT_PROGRESS;

  // Load from localStorage
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      state = { ...DEFAULT_PROGRESS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }

  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());

  const save = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save progress', e);
    }
    emit();
  };

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getYesterdayString = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yyyy = yesterday.getFullYear();
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dd = String(yesterday.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    completeLesson: (lessonId: string, wpm: number, accuracy: number, timeSpent: number, errors: Record<string, number>) => {
      const today = getTodayString();
      const existing = state.completedLessons[lessonId];
      
      // Keep best performance
      const bestWpm = existing ? Math.max(existing.wpm, wpm) : wpm;
      const bestAccuracy = existing ? Math.max(existing.accuracy, accuracy) : accuracy;

      const completedLessons = {
        ...state.completedLessons,
        [lessonId]: {
          wpm: bestWpm,
          accuracy: bestAccuracy,
          completedAt: new Date().toISOString(),
        },
      };

      // Error Heatmap
      const errorHeatmap = { ...state.errorHeatmap };
      Object.entries(errors).forEach(([key, count]) => {
        errorHeatmap[key] = (errorHeatmap[key] || 0) + count;
      });

      // Daily stats
      const dailyHistory = { ...state.dailyHistory };
      const todayStats = dailyHistory[today] || { wpm: 0, accuracy: 0, timeSpent: 0, lessonCount: 0 };
      
      const newLessonCount = todayStats.lessonCount + 1;
      const newWpm = Math.round((todayStats.wpm * todayStats.lessonCount + wpm) / newLessonCount);
      const newAccuracy = Math.round((todayStats.accuracy * todayStats.lessonCount + accuracy) / newLessonCount);
      
      dailyHistory[today] = {
        wpm: newWpm,
        accuracy: newAccuracy,
        timeSpent: todayStats.timeSpent + timeSpent,
        lessonCount: newLessonCount,
      };

      // Streak calculation
      let streak = state.streak;
      const lastDate = state.lastPracticedDate;
      const yesterday = getYesterdayString();

      if (lastDate === null) {
        streak = 1;
      } else if (lastDate === yesterday) {
        streak += 1;
      } else if (lastDate !== today) {
        // If last practiced was before yesterday, reset streak to 1
        streak = 1;
      }

      state = {
        ...state,
        completedLessons,
        errorHeatmap,
        dailyHistory,
        streak,
        lastPracticedDate: today,
        totalPracticeTime: state.totalPracticeTime + timeSpent,
      };

      // Automatically advance currentLessonId to the next index in list if valid
      // This will be handled inside the Result page or custom routing but can be stored
      save();
    },
    updateCurrentLesson: (lessonId: string) => {
      state = {
        ...state,
        currentLessonId: lessonId,
      };
      save();
    },
    updateTimeSpentOnly: (seconds: number) => {
      const today = getTodayString();
      const dailyHistory = { ...state.dailyHistory };
      const todayStats = dailyHistory[today] || { wpm: 0, accuracy: 0, timeSpent: 0, lessonCount: 0 };
      
      dailyHistory[today] = {
        ...todayStats,
        timeSpent: todayStats.timeSpent + seconds,
      };

      state = {
        ...state,
        dailyHistory,
        totalPracticeTime: state.totalPracticeTime + seconds,
      };
      save();
    },
    resetProgress: () => {
      state = DEFAULT_PROGRESS;
      save();
    },
    importProgress: (jsonData: string): boolean => {
      try {
        const parsed = JSON.parse(jsonData);
        // Simple verification that key fields exist
        if (typeof parsed === 'object' && parsed !== null && 'completedLessons' in parsed) {
          state = {
            ...DEFAULT_PROGRESS,
            ...parsed,
          };
          save();
          return true;
        }
        return false;
      } catch (e) {
        console.error('Import failed', e);
        return false;
      }
    },
  };
};

const progressStore = progressStoreSetup();

export const useProgress = () => {
  const state = useSyncExternalStore(progressStore.subscribe, progressStore.getState);

  return {
    progress: state,
    completeLesson: progressStore.completeLesson,
    updateCurrentLesson: progressStore.updateCurrentLesson,
    updateTimeSpentOnly: progressStore.updateTimeSpentOnly,
    resetProgress: progressStore.resetProgress,
    importProgress: progressStore.importProgress,
  };
};
