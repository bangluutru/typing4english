import { fingerMapping } from '../data/fingerMapping';

// Calculate Words Per Minute (WPM)
export const calculateWPM = (correctChars: number, startTime: number | null): number => {
  if (!startTime) return 0;
  const elapsedMinutes = (Date.now() - startTime) / 1000 / 60;
  if (elapsedMinutes <= 0) return 0;
  
  // Standard: 1 word = 5 characters
  const wpm = (correctChars / 5) / elapsedMinutes;
  return Math.round(wpm);
};

// Calculate Typing Accuracy
export const calculateAccuracy = (correctKeystrokes: number, totalKeystrokes: number): number => {
  if (totalKeystrokes <= 0) return 100;
  const acc = (correctKeystrokes / totalKeystrokes) * 100;
  return Math.round(acc * 10) / 10; // Keep 1 decimal place
};

// Simple auto comments generator based on metrics returning translation keys and params
export const generateFeedback = (wpm: number, accuracy: number, weakKeys: string[]): { key: string; params?: Record<string, string | number> } => {
  if (accuracy < 85) {
    return { key: 'typingPractice.feedback.lowAccuracy' };
  }
  
  if (wpm < 15 && accuracy >= 95) {
    return { key: 'typingPractice.feedback.goodAccuracy' };
  }

  if (weakKeys.length > 0) {
    const key = weakKeys[0];
    const mapping = fingerMapping[key];
    if (mapping) {
      return { 
        key: 'typingPractice.feedback.weakKey', 
        params: { key: key === ' ' ? 'Space' : key.toUpperCase(), finger: mapping.finger } 
      };
    }
  }

  if (wpm >= 40 && accuracy >= 95) {
    return { key: 'typingPractice.feedback.excellent' };
  }

  return { key: 'typingPractice.feedback.default' };
};

// Format elapsed seconds to mm:ss
export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
