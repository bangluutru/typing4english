export type Level =
  | 'Alphabet'
  | 'Kids'
  | 'Eiken 5 Kyu'
  | 'Eiken 4 Kyu'
  | 'Eiken 3 Kyu'
  | 'Eiken Pre 2 Kyu'
  | 'Eiken 2 Kyu'
  | 'Eiken Pre 1 Kyu'
  | 'Eiken 1 Kyu'
  | 'TOEIC'
  | 'IELTS'
  | 'TOEFL';

export type GameMode = 'endless' | 'time-attack' | 'boss';

export type TrainingMode = 'learning' | 'battle';

export interface WordLearningStats {
  word: string;
  attempts: number;
  correctHits: number;
  mistakes: number;
  averageResponseMs: number;
  lastSeenAt: number;
  isStarred?: boolean;
  isSkipped?: boolean;
  masteryScore?: number;
  nextReviewTime?: number;
  srsIntervalDays?: number;
}

export type Language = 'vi' | 'ja';

export type GamePhase = 'ready' | 'playing' | 'paused' | 'ended';

export interface DictionaryEntry {
  word: string;
  meaning_vi: string;
  meaning_ja: string;
  level: Level;
  difficulty: number; // 1-3
  emoji?: string;
}

export interface WordAircraft {
  id: string;
  word: string;
  meaning: string;
  emoji?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  angle: number; // in radians
  rotation: number; // visual tilt angle
  targetX: number;
  targetY: number;
  progress: number; // Index of current character being typed
  active: boolean;
  spawnTime: number;
  pathType: 'sinusoidal' | 'linear' | 's-curve' | 'swoop';
  amplitude: number;
  frequency: number;
  phaseOffset: number;
  isBoss: boolean;
  maxShields?: number; // for boss targets
  shields?: number;
  mistakes?: number;
  firstKeyTime?: number;
}

export interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  shield: number; // 0 to 100
  accuracy: number; // percentage
  wpm: number;
  wordsTyped: number;
  accurateKeys: number;
  totalKeys: number;
  timeElapsed: number; // in seconds
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  glow?: boolean;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  alpha: number;
  color: string;
  thickness: number;
}

export interface SoundSettings {
  sfxVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
  sfxEnabled: boolean;
  musicEnabled: boolean;
  pronounceOnDestroy?: boolean;
  pronunciationAccent?: 'us' | 'uk';
}

export interface ReviewItem {
  word: string;
  meaning: string;
  emoji?: string;
  success: boolean;
  attempts: number;
  errors: number;
}

export type KeyboardLayoutType = 'qwerty';

export type FingerId =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'left-thumb'
  | 'right-thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky';

export interface TypingCoachSettings {
  enabled: boolean;
  showVirtualKeyboard: boolean;
  showFingerGuide: boolean;
  showNextKeyHint: boolean;
  showHomeRowHint: boolean;
  animationEnabled: boolean;
  keyboardLayout: KeyboardLayoutType;
  position: 'bottom' | 'right' | 'compact';
  overlayMode: 'solid' | 'translucent' | 'ghost' | 'auto';
  autoCollapse: boolean;
  showFullKeyboardDuringGame: boolean;
  keyboardSize?: number;
  keyboardOpacity?: number;
}

export type VocabularyFilter = 'all' | 'starred' | 'exclude-mastered' | 'srs';

export type ShooterType = 'airplane' | 'tank' | 'butterfly' | 'penguin';

export interface GameSettings {
  aircraftSpeedMultiplier: number;
  meaningFadeSpeedMultiplier: number;
  meaningFontSizeMultiplier: number;
  uiLanguage: UILanguage;
  typingCoach: TypingCoachSettings;
  vocabularyFilter: VocabularyFilter;
  shooterType?: ShooterType;
  theme?: 'cyberpunk' | 'magical';
}

export type UILanguage = 'en' | 'ja' | 'vi';

export interface CustomWordList {
  id: string;
  name: string;
  description?: string;
  entries: DictionaryEntry[];
  createdAt: number;
  updatedAt: number;
}
