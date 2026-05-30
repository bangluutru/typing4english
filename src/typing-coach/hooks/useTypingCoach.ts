import { useMemo } from 'react';
import type { TypingCoachSettings, FingerId } from '../../types/game';
import { getKeyDefinition } from '../data/keyboardLayout';
import type { KeyDefinition } from '../data/keyboardLayout';

interface UseTypingCoachProps {
  activeWord: string | null;
  progress: number;
  settings: TypingCoachSettings;
}

export interface UseTypingCoachResult {
  currentKey: string | null;
  currentKeyDefinition: KeyDefinition | null;
  currentFinger: FingerId | null;
  typedPart: string;
  remainingPart: string;
  isSupportedKey: boolean;
}

export const useTypingCoach = ({ activeWord, progress, settings }: UseTypingCoachProps): UseTypingCoachResult => {
  return useMemo(() => {
    if (!settings.enabled || !activeWord) {
      return {
        currentKey: null,
        currentKeyDefinition: null,
        currentFinger: null,
        typedPart: '',
        remainingPart: '',
        isSupportedKey: false,
      };
    }

    const typedPart = activeWord.slice(0, progress);
    const remainingPart = activeWord.slice(progress);
    const currentKey = remainingPart[0] ?? null;

    if (!currentKey) {
      return {
        currentKey: null,
        currentKeyDefinition: null,
        currentFinger: null,
        typedPart,
        remainingPart,
        isSupportedKey: false,
      };
    }

    const currentKeyDefinition = getKeyDefinition(currentKey) ?? null;
    const currentFinger = currentKeyDefinition?.finger ?? null;
    const isSupportedKey = !!currentKeyDefinition;

    return {
      currentKey,
      currentKeyDefinition,
      currentFinger,
      typedPart,
      remainingPart,
      isSupportedKey,
    };
  }, [activeWord, progress, settings.enabled]);
};
