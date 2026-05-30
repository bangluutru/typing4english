import { useSyncExternalStore } from 'react';

export type TypingThemeType = 'light' | 'dark' | 'kid';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type PracticeMode = 'accuracy' | 'speed' | 'free';

export interface TypingPracticeSettings {
  theme: TypingThemeType;
  soundEnabled: boolean;
  handsEnabled: boolean;
  backspaceEnabled: boolean;
  practiceMode: PracticeMode;
  fontSize: FontSize;
  keyboardLayout: string;
}

const DEFAULT_SETTINGS: TypingPracticeSettings = {
  theme: 'light',
  soundEnabled: true,
  handsEnabled: true,
  backspaceEnabled: true,
  practiceMode: 'accuracy',
  fontSize: 'lg',
  keyboardLayout: 'qwerty',
};

const LOCAL_STORAGE_KEY = 'typing_adventure_typing_settings';
const OLD_LOCAL_STORAGE_KEY = 'typemaster_settings';

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
  console.error('Failed to migrate typemaster settings', e);
}

// Vanilla store implementation optimized specifically for TypingPracticeSettings
const createSettingsStore = (initialState: TypingPracticeSettings, localStorageKey: string) => {
  let state = initialState;
  
  try {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      state = { ...initialState, ...JSON.parse(saved) };
      applyThemeClass(state.theme);
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }

  const listeners = new Set<() => void>();

  return {
    getState: () => state,
    setState: (updater: Partial<TypingPracticeSettings> | ((prev: TypingPracticeSettings) => TypingPracticeSettings)) => {
      const nextState = typeof updater === 'function' 
        ? (updater as Function)(state) 
        : { ...state, ...updater };
      
      state = nextState;
      
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save settings', e);
      }

      if (nextState.theme) {
        applyThemeClass(nextState.theme);
      }

      listeners.forEach((l) => l());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
};

function applyThemeClass(theme: TypingThemeType) {
  if (typeof document !== 'undefined') {
    const body = document.body;
    body.classList.remove('dark', 'kid');
    if (theme === 'dark') body.classList.add('dark');
    if (theme === 'kid') body.classList.add('kid');
  }
}

const settingsStore = createSettingsStore(DEFAULT_SETTINGS, LOCAL_STORAGE_KEY);

export const useSettings = () => {
  const state = useSyncExternalStore(settingsStore.subscribe, settingsStore.getState);
  
  const setSettings = (updater: Partial<TypingPracticeSettings> | ((prev: TypingPracticeSettings) => TypingPracticeSettings)) => {
    settingsStore.setState(updater);
  };

  return [state, setSettings] as const;
};
