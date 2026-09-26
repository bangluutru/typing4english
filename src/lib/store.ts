import { useSyncExternalStore } from 'react';

/* --------------------------------------------------------------------------
   Persistent app state: settings + learning progress, both in localStorage.
   One tiny external store per key so components subscribe with
   useSyncExternalStore and never see torn state.
   -------------------------------------------------------------------------- */

export type UiLang = 'ja' | 'vi' | 'en';
export type MeaningLang = 'ja' | 'vi';
export type KeyboardLayoutId = 'jis' | 'us';
type ThemePref = 'light' | 'dark' | 'system';
export type GradeId = '5' | '4' | '3' | 'pre2' | '2' | 'pre1' | '1';

export interface Settings {
  uiLang: UiLang;
  meaningLang: MeaningLang;
  furigana: boolean;
  layout: KeyboardLayoutId;
  showKeyboard: boolean;
  showHands: boolean;
  sound: boolean;
  voice: boolean;
  theme: ThemePref;
  grade: GradeId;
}

interface LessonRecord { stars: number; bestKpm: number; bestAcc: number; plays: number }
export interface KeyStat { hit: number; miss: number }
/** Leitner box 0..5; `due` is a day number (days since epoch, local time). */
interface WordRecord { box: number; due: number; right: number; wrong: number }
interface DayRecord { sec: number; keys: number; words: number }

export interface Progress {
  lessons: Record<string, LessonRecord>;
  keys: Record<string, KeyStat>;
  words: Record<string, WordRecord>;
  days: Record<string, DayRecord>;
  gameBest: Record<string, number>;
}

const SETTINGS_KEY = 't4e:settings';
const PROGRESS_KEY = 't4e:progress';

/**
 * `?lang=ja|vi|en` picks the interface language.
 *
 * chottoday.com is a Vietnamese site and links here with ?lang=vi: many
 * Vietnamese families in Japan keep their phone in Japanese, so guessing from
 * the browser would land them on the Japanese screen. An explicit parameter wins
 * over a saved choice, is then saved like any other choice, and is removed from
 * the address bar so a reload does not undo a later change in Settings.
 * index.html reads the same parameter to set <html lang> before first paint.
 */
function takeLangParam(): UiLang | null {
  try {
    const url = new URL(window.location.href);
    const v = url.searchParams.get('lang');
    if (v === null) return null;
    url.searchParams.delete('lang');
    history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    return v === 'ja' || v === 'vi' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

const URL_LANG = takeLangParam();

function detectLang(): UiLang {
  if (URL_LANG) return URL_LANG;
  const l = (navigator.language || 'ja').toLowerCase();
  if (l.startsWith('vi')) return 'vi';
  if (l.startsWith('en')) return 'en';
  return 'ja';
}

const defaultSettings = (): Settings => {
  const uiLang = detectLang();
  return {
    uiLang,
    meaningLang: uiLang === 'vi' ? 'vi' : 'ja',
    furigana: true,
    layout: 'jis',
    showKeyboard: true,
    showHands: true,
    sound: true,
    voice: true,
    theme: 'light',
    grade: '5',
  };
};

const emptyProgress = (): Progress => ({ lessons: {}, keys: {}, words: {}, days: {}, gameBest: {} });

function read<T extends object>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...fallback(), ...parsed };
    }
  } catch {
    /* private mode or corrupt JSON: start fresh */
  }
  return fallback();
}

function createStore<T extends object>(key: string, fallback: () => T) {
  let state = read(key, fallback);
  const listeners = new Set<() => void>();
  const persist = () => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* quota / private mode */ }
  };
  return {
    get: () => state,
    set(next: T | ((prev: T) => T)) {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      persist();
      listeners.forEach(l => l());
    },
    reset() { state = fallback(); persist(); listeners.forEach(l => l()); },
    subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  };
}

export const settingsStore = createStore<Settings>(SETTINGS_KEY, defaultSettings);
export const progressStore = createStore<Progress>(PROGRESS_KEY, emptyProgress);

// A first visit already got URL_LANG through detectLang(); a returning one has
// saved settings, so only the interface language changes (not meaningLang).
if (URL_LANG) settingsStore.set(s => (s.uiLang === URL_LANG ? s : { ...s, uiLang: URL_LANG }));

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const s = useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
  return [s, patch => settingsStore.set(prev => ({ ...prev, ...patch }))];
}

export function useProgress(): Progress {
  return useSyncExternalStore(progressStore.subscribe, progressStore.get);
}

/* ---------- date helpers (local calendar days) ---------- */

export const todayNum = (d = new Date()) =>
  Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);
export const dayKey = (d = new Date()) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/* ---------- progress mutations ---------- */

export function logActivity(sec: number, keys: number, words = 0) {
  const k = dayKey();
  progressStore.set(p => {
    const d = p.days[k] ?? { sec: 0, keys: 0, words: 0 };
    return { ...p, days: { ...p.days, [k]: { sec: d.sec + Math.round(sec), keys: d.keys + keys, words: d.words + words } } };
  });
}

export function recordKeyStats(stats: Record<string, KeyStat>) {
  progressStore.set(p => {
    const keys = { ...p.keys };
    for (const [ch, s] of Object.entries(stats)) {
      const k = ch.toLowerCase();
      const prev = keys[k] ?? { hit: 0, miss: 0 };
      keys[k] = { hit: prev.hit + s.hit, miss: prev.miss + s.miss };
    }
    return { ...p, keys };
  });
}

export function recordLesson(id: string, stars: number, kpm: number, acc: number) {
  progressStore.set(p => {
    const prev = p.lessons[id] ?? { stars: 0, bestKpm: 0, bestAcc: 0, plays: 0 };
    return {
      ...p,
      lessons: {
        ...p.lessons,
        [id]: {
          stars: Math.max(prev.stars, stars),
          bestKpm: Math.max(prev.bestKpm, Math.round(kpm)),
          bestAcc: Math.max(prev.bestAcc, Math.round(acc)),
          plays: prev.plays + 1,
        },
      },
    };
  });
}

/** Days until the next review for each Leitner box. */
const BOX_INTERVALS = [0, 1, 2, 4, 7, 15];
export const MASTERED_BOX = 4;

/** Update spaced-repetition state after the child recalls (or fails) a word. */
export function reviewWord(id: string, correct: boolean) {
  const today = todayNum();
  progressStore.set(p => {
    const prev = p.words[id];
    const box = correct ? Math.min(5, (prev?.box ?? 0) + 1) : 1;
    const rec: WordRecord = {
      box,
      due: today + (correct ? BOX_INTERVALS[box] : 0),
      right: (prev?.right ?? 0) + (correct ? 1 : 0),
      wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    };
    return { ...p, words: { ...p.words, [id]: rec } };
  });
}

export function recordGameScore(key: string, score: number) {
  progressStore.set(p => (score > (p.gameBest[key] ?? 0) ? { ...p, gameBest: { ...p.gameBest, [key]: score } } : p));
}

export function streakDays(p: Progress): number {
  let n = 0;
  const d = new Date();
  if (!p.days[dayKey(d)]) d.setDate(d.getDate() - 1); // today not practised yet: streak still alive
  while (p.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ---------- backup ---------- */

export function exportData(): string {
  return JSON.stringify({ app: 'typing4english', version: 2, settings: settingsStore.get(), progress: progressStore.get() }, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data?.app !== 'typing4english' || typeof data.progress !== 'object') return false;
    const p = data.progress;
    const ok = ['lessons', 'keys', 'words', 'days'].every(k => p[k] && typeof p[k] === 'object' && !Array.isArray(p[k]));
    if (!ok) return false;
    progressStore.set({ ...emptyProgress(), ...p });
    if (data.settings && typeof data.settings === 'object') settingsStore.set({ ...defaultSettings(), ...data.settings });
    return true;
  } catch {
    return false;
  }
}
