import React, { useEffect, useRef, useState } from 'react';
import type { GameMode, GameStats, Language, LaserBeam, Level, Particle, ReviewItem, WordAircraft, GameSettings, GamePhase, DictionaryEntry, WordLearningStats, TrainingMode, SoundSettings } from '../types/game';
import { fetchLevelData, fetchBossWords, fetchPhrases } from '../data/api';
import { useTranslation } from '../i18n/useTranslation';
import { createRandomPathConfig, updateAircraftPosition } from '../utils/math';
import { Shield, Sparkles, Zap, Award, Target, Pause, Play, AlertCircle } from 'lucide-react';
import { TypingCoachPanel } from '../typing-coach/components/TypingCoachPanel';
import { drawGameBoardCanvas } from './GameBoard/canvasRenderer';

function getEntryMeaning(entry: DictionaryEntry, lang: Language): string {
  const vi = entry.meaning_vi?.trim() || '';
  const ja = entry.meaning_ja?.trim() || '';
  if (lang === 'ja') return ja || vi || entry.word;
  return vi || ja || entry.word;
}

function getNextLetterProgress(word: string, currentProgress: number): number {
  let p = currentProgress;
  while (p < word.length && !/^[a-zA-Z0-9]$/.test(word[p])) {
    p++;
  }
  return p;
}


interface GameBoardProps {
  level: Level;
  mode: GameMode;
  lang: Language;
  onGameOver: (stats: GameStats, wordLogs: ReviewItem[]) => void;
  onBackToMenu: () => void;
  playLaser: () => void;
  playHit: () => void;
  playMiss: () => void;
  playExplosion: () => void;
  playComboAlert: (combo: number) => void;
  playLevelUp: () => void;
  reviewList?: ReviewItem[];
  isReview?: boolean;
  // Extended props
  gameSettings: GameSettings;
  onSetGameSettings?: (settings: GameSettings) => void;
  customWords?: DictionaryEntry[];
  trainingMode?: TrainingMode;
  speakWord?: (word: string) => void;
  soundSettings?: SoundSettings;
  onTogglePronounce?: () => void;
  onSetPronunciationAccent?: (accent: 'us' | 'uk') => void;
}

interface FloatingMeaning {
  id: string;
  text: string;
  x: number;
  y: number;
  alpha: number;
  emoji?: string;
  color: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  level,
  mode,
  lang,
  onGameOver,
  onBackToMenu,
  playLaser,
  playHit,
  playMiss,
  playExplosion,
  playComboAlert,
  playLevelUp,
  reviewList = [],
  isReview = false,
  gameSettings,
  onSetGameSettings,
  customWords = [],
  trainingMode = 'battle',
  speakWord,
  soundSettings,
  onTogglePronounce,
  onSetPronunciationAccent,
}) => {
  const t = useTranslation(gameSettings.uiLanguage);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game states
  const [gamePhase, setGamePhase] = useState<GamePhase>('ready');
  const [hudStats, setHudStats] = useState<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    shield: 100,
    accuracy: 100,
    wpm: 0,
    wordsTyped: 0,
    accurateKeys: 0,
    totalKeys: 0,
    timeElapsed: 0,
  });

  // Typing Coach State Bridge
  const [typingCoachState, setTypingCoachState] = useState({
    activeWord: null as string | null,
    progress: 0,
  });

  // Dynamic layout offsets for responsive mobile/coach layouts
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const processTypedKeyRef = useRef<((pressedKey: string, isSpecialKey?: boolean, code?: string) => void) | undefined>(undefined);
  const [activeVirtualKey, setActiveVirtualKey] = useState<string | null>(null);

  const handleVirtualKeyPress = (e: React.TouchEvent | React.MouseEvent, key: string, isSpecial = false, code?: string) => {
    e.preventDefault();
    if (processTypedKeyRef.current) {
      processTypedKeyRef.current(key, isSpecial, code);
    }
  };

  const renderVirtualKey = (key: string) => {
    const isKeyActive = activeVirtualKey === key;
    return (
      <button
        key={key}
        onTouchStart={(e) => {
          setActiveVirtualKey(key);
          handleVirtualKeyPress(e, key);
        }}
        onTouchEnd={() => setActiveVirtualKey(null)}
        onMouseDown={(e) => {
          setActiveVirtualKey(key);
          handleVirtualKeyPress(e, key);
        }}
        onMouseUp={() => setActiveVirtualKey(null)}
        onMouseLeave={() => setActiveVirtualKey(null)}
        className={`flex-1 h-12 m-[2px] rounded-xl flex items-center justify-center font-black text-sm transition-all select-none uppercase ${
          isKeyActive
            ? 'bg-cyber-accent text-cyber-dark shadow-neon-cyan scale-95 border-cyber-accent font-black'
            : 'glass-panel text-white hover:bg-cyber-accent/10 border-cyber-accent/20'
        } cursor-pointer`}
        style={{
          touchAction: 'manipulation'
        }}
      >
        {key}
      </button>
    );
  };

  useEffect(() => {
    const checkLayout = () => {
      setIsMobileLayout(window.innerWidth <= 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0);
    };
    checkLayout();
    window.addEventListener('resize', checkLayout);
    return () => window.removeEventListener('resize', checkLayout);
  }, []);

  const shieldOffset = isMobileLayout ? 260 : (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'bottom' ? 180 : 110);
  const shipOffset = isMobileLayout ? 165 : (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'bottom' ? 120 : 15);
  const gunYOffset = isMobileLayout ? 180 : (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'bottom' ? 135 : 30);

  // Reference vectors for loop logic to avoid react re-render delays
  const stateRef = useRef<{
    aircrafts: WordAircraft[];
    particles: Particle[];
    lasers: LaserBeam[];
    floatingMeanings: FloatingMeaning[];
    lockedTargetId: string | null;
    stats: GameStats;
    wordLogs: ReviewItem[];
    lastSpawnTime: number;
    gameTime: number;
    spawnInterval: number;
    keysPressedInInterval: number;
    accuracyHistory: { accurate: number; total: number }[];
    shakeTime: number;
    shipAngle: number;
  }>({
    aircrafts: [],
    particles: [],
    lasers: [],
    floatingMeanings: [],
    lockedTargetId: null,
    stats: {
      score: 0,
      combo: 0,
      maxCombo: 0,
      shield: 100,
      accuracy: 100,
      wpm: 0,
      wordsTyped: 0,
      accurateKeys: 0,
      totalKeys: 0,
      timeElapsed: 0,
    },
    wordLogs: [],
    lastSpawnTime: 0,
    gameTime: 0,
    spawnInterval: 2800, // starting spawn rate (ms)
    keysPressedInInterval: 0,
    accuracyHistory: [],
    shakeTime: 0,
    shipAngle: 0,
  });

  const [shakeClass, setShakeClass] = useState('');

  // 1. Initialize Word Dictionary Pool based on selected level or review list or custom list
  const wordPoolRef = useRef<DictionaryEntry[]>([]);
  const bossWordsRef = useRef<string[]>([]);
  
  useEffect(() => {
    let isMounted = true;

    const loadWords = async () => {
      // Load Boss Words if mode is boss
      if (mode === 'boss' && bossWordsRef.current.length === 0) {
        const bosses = await fetchBossWords();
        if (isMounted) bossWordsRef.current = bosses;
      }

      if (isReview && reviewList && reviewList.length > 0) {
        const words = reviewList.map(r => ({
          word: r.word,
          meaning_vi: r.meaning,
          meaning_ja: r.meaning,
          level: level,
          difficulty: 2,
          emoji: r.emoji
        }));
        if (isMounted) wordPoolRef.current = words;
      } else if (customWords && customWords.length > 0) {
        // Load selected custom words!
        const words = customWords.map(c => ({
          ...c,
          level: level, // match level for structural compatibility
        }));
        if (isMounted) wordPoolRef.current = words;
      } else {
        // Fetch dictionary by selected level
        let filtered = await fetchLevelData(level);
        
        // Load and filter based on local user stats (Skip, Star, Mastery, SRS)
        try {
          const statsSaved = localStorage.getItem('typing_combat_word_stats');
          let statsMap: { [word: string]: WordLearningStats } = {};
          if (statsSaved) {
            statsMap = JSON.parse(statsSaved) || {};
          }

          // Always exclude manually skipped (known) words
          filtered = filtered.filter(item => {
            const key = item.word.toLowerCase();
            const stat = statsMap[key];
            return !(stat && stat.isSkipped);
          });

          // Apply active learning filter
          const activeFilter = gameSettings.vocabularyFilter || 'all';
          if (activeFilter === 'starred') {
            filtered = filtered.filter(item => {
              const key = item.word.toLowerCase();
              const stat = statsMap[key];
              return stat && stat.isStarred;
            });
          } else if (activeFilter === 'exclude-mastered') {
            filtered = filtered.filter(item => {
              const key = item.word.toLowerCase();
              const stat = statsMap[key];
              const score = stat?.masteryScore ?? 0;
              return score < 3;
            });
          } else if (activeFilter === 'srs') {
            const now = Date.now();
            filtered = filtered.filter(item => {
              const key = item.word.toLowerCase();
              const stat = statsMap[key];
              if (!stat) return true; // new word, review it
              if (!stat.nextReviewTime) return true; // seen but not scheduled
              return stat.nextReviewTime <= now; // due for review
            });
          }
        } catch {
          // ignore storage errors, use normal filtering
        }
        
        // Fallback if level dictionary is dry
        if (filtered.length === 0) {
          const rawLevel = await fetchLevelData(level);
          filtered = rawLevel.slice(0, 15);
        }
        
        // Add some random phrases in matching levels or modes
        if (level === 'Eiken 3 Kyu' || level === 'Eiken Pre 2 Kyu' || mode === 'boss') {
          const rawPhrases = await fetchPhrases();
          const phraseCopies = rawPhrases.map(p => ({ ...p, level }));
          
          // Filter phrases through same learning filters
          try {
            const statsSaved = localStorage.getItem('typing_combat_word_stats');
            let statsMap: { [word: string]: WordLearningStats } = {};
            if (statsSaved) {
              statsMap = JSON.parse(statsSaved) || {};
            }
            let filteredPhrases = phraseCopies.filter(item => {
              const key = item.word.toLowerCase();
              const stat = statsMap[key];
              return !(stat && stat.isSkipped);
            });
            const activeFilter = gameSettings.vocabularyFilter || 'all';
            if (activeFilter === 'starred') {
              filteredPhrases = filteredPhrases.filter(item => {
                const key = item.word.toLowerCase();
                const stat = statsMap[key];
                return stat && stat.isStarred;
              });
            } else if (activeFilter === 'exclude-mastered') {
              filteredPhrases = filteredPhrases.filter(item => {
                const key = item.word.toLowerCase();
                const stat = statsMap[key];
                return (stat?.masteryScore ?? 0) < 3;
              });
            }
            filtered = [...filtered, ...filteredPhrases];
          } catch {
            filtered = [...filtered, ...phraseCopies];
          }
        }
        
        if (isMounted) wordPoolRef.current = filtered;
      }
    };
    
    loadWords();

    return () => { isMounted = false; };
  }, [level, mode, isReview, reviewList, lang, customWords, gameSettings.vocabularyFilter]);

  // Explicit safe Reset state loader
  const resetGameState = () => {
    const state = stateRef.current;
    state.aircrafts = [];
    state.particles = [];
    state.lasers = [];
    state.floatingMeanings = [];
    state.lockedTargetId = null;
    state.stats = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      shield: 100,
      accuracy: 100,
      wpm: 0,
      wordsTyped: 0,
      accurateKeys: 0,
      totalKeys: 0,
      timeElapsed: 0,
    };
    state.wordLogs = [];
    state.lastSpawnTime = performance.now();
    state.spawnInterval = 2800;
    state.shakeTime = 0;
    state.shipAngle = 0;

    setGamePhase('ready');
    setHudStats({ ...state.stats });
    setTypingCoachState({ activeWord: null, progress: 0 });
  };



  // Handle Pause
  const handlePauseToggle = () => {
    setGamePhase(prev => {
      if (prev === 'playing') return 'paused';
      if (prev === 'paused') return 'playing';
      return prev;
    });
  };

  // Blur any focused element (like buttons) to prevent browser default trigger on Space bar
  useEffect(() => {
    if (gamePhase === 'ready' || gamePhase === 'playing') {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, [gamePhase]);

  // 2. Typing Event Listener
  useEffect(() => {
    const processTypedKey = (pressedKey: string, isSpecialKey: boolean = false, code?: string) => {
      if (pressedKey === 'Escape') {
        if (gamePhase === 'playing') {
          setGamePhase('paused');
        } else if (gamePhase === 'paused') {
          resetGameState();
        }
        return;
      }

      if (gamePhase === 'paused' || gamePhase === 'ended') return;

      // In ready phase, wait for Space key to start the game
      if (gamePhase === 'ready') {
        if (pressedKey === ' ' || code === 'Space') {
          setGamePhase('playing');
          stateRef.current.lastSpawnTime = performance.now();
        }
        return;
      }

      // Ignore modifiers or non-char keys unless they are handled specially
      if (!isSpecialKey && pressedKey.length !== 1) return;

      const state = stateRef.current;
      state.stats.totalKeys += 1;
      
      // Target finding & verification
      if (state.lockedTargetId) {
        // Evaluate locked target
        const target = state.aircrafts.find(a => a.id === state.lockedTargetId && a.active);
        
        if (target) {
          const nextChar = target.word[target.progress];
          
          if (pressedKey.toLowerCase() === nextChar.toLowerCase()) {
            // MATCH!
            target.progress = getNextLetterProgress(target.word, target.progress + 1);
            if (target.progress < target.word.length) {
              setTypingCoachState({ activeWord: target.word, progress: target.progress });
            }
            state.stats.accurateKeys += 1;
            state.stats.combo += 1;
            
            if (state.stats.combo > state.stats.maxCombo) {
              state.stats.maxCombo = state.stats.combo;
            }

            // Laser Fire
            playLaser();
            const shipX = window.innerWidth / 2 - (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'right' ? 180 : 0);
            const shipY = window.innerHeight - gunYOffset;
            const laserColor = {
              airplane: '#00f3ff',
              tank: '#ff7700',
              butterfly: '#ff0077',
              turtle: '#fbbf24',
            }[gameSettings.shooterType || 'airplane'] || '#00f3ff';

            state.lasers.push({
              startX: shipX,
              startY: shipY,
              endX: target.x + target.width / 2,
              endY: target.y + target.height / 2,
              alpha: 1.0,
              color: laserColor,
              thickness: 3.5,
            });

            // Swivel Ship
            state.shipAngle = Math.atan2(target.x + target.width / 2 - shipX, shipY - (target.y + target.height / 2));

            // Small spark particle hit
            spawnHitSpark(target.x + target.width / 2, target.y + target.height / 2, '#00ff66');
            playHit();

            // Check if word completely typed
            if (target.progress >= target.word.length) {
              destroyWord(target);
            }
          } else {
            // MISMATCH!
            target.mistakes = (target.mistakes || 0) + 1;
            triggerMiss(target);
          }
        } else {
          // Target disappeared, unlock
          state.lockedTargetId = null;
          setTypingCoachState({ activeWord: null, progress: 0 });
        }
      } else {
        // No target locked: Find candidate starting with the typed letter
        const candidates = state.aircrafts.filter(
          a => a.active && a.word[a.progress || 0] && a.word[a.progress || 0].toLowerCase() === pressedKey.toLowerCase()
        );

        if (candidates.length > 0) {
          // Priority selection: Target closest to the bottom (highest Y value, representing highest threat)
          candidates.sort((a, b) => b.y - a.y);
          const chosen = candidates[0];
          
          state.lockedTargetId = chosen.id;
          chosen.firstKeyTime = performance.now();
          chosen.mistakes = 0;
          chosen.progress = getNextLetterProgress(chosen.word, chosen.progress + 1);
          if (chosen.progress < chosen.word.length) {
            setTypingCoachState({ activeWord: chosen.word, progress: chosen.progress });
          }
          state.stats.accurateKeys += 1;
          state.stats.combo += 1;
          
          if (state.stats.combo > state.stats.maxCombo) {
            state.stats.maxCombo = state.stats.combo;
          }

          // Laser Fire
          playLaser();
          const shipX = window.innerWidth / 2 - (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'right' ? 180 : 0);
          const shipY = window.innerHeight - gunYOffset;
          const laserColor = {
            airplane: '#00f3ff',
            tank: '#ff7700',
            butterfly: '#ff0077',
            turtle: '#fbbf24',
          }[gameSettings.shooterType || 'airplane'] || '#00f3ff';

          state.lasers.push({
            startX: shipX,
            startY: shipY,
            endX: chosen.x + chosen.width / 2,
            endY: chosen.y + chosen.height / 2,
            alpha: 1.0,
            color: laserColor,
            thickness: 3.5,
          });

          // Swivel Ship
          state.shipAngle = Math.atan2(chosen.x + chosen.width / 2 - shipX, shipY - (chosen.y + chosen.height / 2));

          spawnHitSpark(chosen.x + chosen.width / 2, chosen.y + chosen.height / 2, '#00ff66');
          playHit();

          if (chosen.progress >= chosen.word.length) {
            destroyWord(chosen);
          }
        } else {
          // Miss completely (no matching letters on screen)
          triggerGlobalMiss();
        }
      }

      // Calculate accuracy
      state.stats.accuracy = Math.round((state.stats.accurateKeys / state.stats.totalKeys) * 100);
      setHudStats({ ...state.stats });
    };

    processTypedKeyRef.current = processTypedKey;

    // Attach to window global ref for mobile key triggers
    (window as any)._triggerMobileKey = (key: string, isSpecial: boolean = false, code?: string) => {
      processTypedKey(key, isSpecial, code);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key handles pausing (stopping) or resetting
      if (e.key === 'Escape') {
        e.preventDefault();
        processTypedKey('Escape', true);
        return;
      }

      if (gamePhase === 'paused' || gamePhase === 'ended') return;

      // In ready phase, wait for Space key to start the game
      if (gamePhase === 'ready') {
        if (e.key === ' ' || e.code === 'Space') {
          e.preventDefault(); // prevent window scrolling
          processTypedKey(' ', true, 'Space');
        }
        return;
      }

      // Ignore modifiers (CMD, CTRL, SHIFT, ALT)
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;

      processTypedKey(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete (window as any)._triggerMobileKey;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, gameSettings, lang, level, mode, customWords, gunYOffset]);

  // Miss typed target
  function triggerMiss(target: WordAircraft) {
    const state = stateRef.current;
    state.stats.combo = 0;
    playMiss();

    // Spawn error sparks
    spawnHitSpark(target.x + target.width / 2, target.y + target.height / 2, '#ff0055');

    // Trigger visual target shake in DOM via shake class
    const element = document.getElementById(`aircraft-${target.id}`);
    if (element) {
      element.classList.add('animate-shake');
      setTimeout(() => element.classList.remove('animate-shake'), 300);
    }
  };

  // Miss when no letters match at all
  function triggerGlobalMiss() {
    const state = stateRef.current;
    state.stats.combo = 0;
    playMiss();
  };

  // Spark Generation
  function spawnHitSpark(x: number, y: number, color: string) {
    const state = stateRef.current;
    for (let i = 0; i < 15; i++) {
      state.particles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: (Math.random() * 2 - 1) * 3,
        vy: (Math.random() * 2 - 1) * 3,
        color,
        size: Math.random() * 3 + 1.5,
        alpha: 1.0,
        life: 0,
        maxLife: 30 + Math.random() * 20,
      });
    }
  };

  // Word complete explosion & reward
  function destroyWord(target: WordAircraft) {
    const state = stateRef.current;
    target.active = false;
    
    // Unlock
    if (state.lockedTargetId === target.id) {
      state.lockedTargetId = null;
      setTypingCoachState({ activeWord: null, progress: 0 });
    }

    // Award Points (length, speed, accuracy, combo)
    const comboMultiplier = Math.max(1, Math.floor(state.stats.combo / 5));
    const levelMultiplier = 
      level === 'Alphabet' ? 1 :
      level === 'Kids' ? 1.2 :
      level === 'Eiken 5 Kyu' ? 1.5 :
      level === 'Eiken 4 Kyu' ? 1.8 :
      level === 'Eiken 3 Kyu' ? 2.0 :
      level === 'Eiken Pre 2 Kyu' ? 2.2 :
      level === 'Eiken 2 Kyu' ? 2.5 :
      level === 'Eiken Pre 1 Kyu' ? 3.0 :
      level === 'Eiken 1 Kyu' ? 3.5 :
      level === 'TOEIC' ? 2.8 :
      level === 'IELTS' ? 3.2 :
      level === 'TOEFL' ? 3.5 : 4;
    const baseWordScore = target.word.length * 10;
    const addedScore = Math.round(baseWordScore * comboMultiplier * levelMultiplier);
    
    const prevScore = state.stats.score;
    state.stats.score += addedScore;
    state.stats.wordsTyped += 1;

    // Call level up sound every 500 score milestone
    if (Math.floor(state.stats.score / 500) > Math.floor(prevScore / 500)) {
      playLevelUp();
    }

    // Check combo milestones
    if (state.stats.combo > 0 && state.stats.combo % 10 === 0) {
      playComboAlert(state.stats.combo);
    }

    // Play massive sound and explosion particles
    playExplosion();
    speakWord?.(target.word);

    // 1. Spawning large explosive debris
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      state.particles.push({
        id: Math.random().toString(),
        x: target.x + target.width / 2,
        y: target.y + target.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? '#00f3ff' : '#00ff66',
        size: Math.random() * 5 + 2,
        alpha: 1.0,
        life: 0,
        maxLife: 45 + Math.random() * 30,
        glow: true,
      });
    }

    // 2. Generate Floating meaning translations
    state.floatingMeanings.push({
      id: Math.random().toString(),
      text: target.meaning,
      emoji: target.emoji,
      x: target.x + target.width / 2,
      y: target.y,
      alpha: 1.0,
      color: lang === 'vi' ? '#00ff66' : '#ff7700',
    });

    // 3. Log to session reviews
    const existingLog = state.wordLogs.find(w => w.word === target.word);
    if (existingLog) {
      existingLog.success = true;
      existingLog.attempts += 1;
    } else {
      state.wordLogs.push({
        word: target.word,
        meaning: target.meaning,
        emoji: target.emoji,
        success: true,
        attempts: 1,
        errors: 0,
      });
    }

    // 4. Save to word learning stats per word in localStorage
    try {
      const statsSaved = localStorage.getItem('typing_combat_word_stats');
      let wordStatsMap: { [word: string]: WordLearningStats } = {};
      if (statsSaved) {
        try {
          wordStatsMap = JSON.parse(statsSaved) || {};
        } catch {
          // ignore corrupted data, use new map
        }
      }

      const wKey = target.word.toLowerCase();
      const existingWordStat = wordStatsMap[wKey] || {
        word: target.word,
        attempts: 0,
        correctHits: 0,
        mistakes: 0,
        averageResponseMs: 0,
        lastSeenAt: 0,
      };

      existingWordStat.attempts += 1;
      existingWordStat.correctHits += target.word.length;
      existingWordStat.mistakes += target.mistakes || 0;

      const firstTime = target.firstKeyTime || target.spawnTime;
      const wordTimeTaken = performance.now() - firstTime;
      const wordAvgResp = wordTimeTaken / target.word.length;

      if (existingWordStat.averageResponseMs > 0) {
        existingWordStat.averageResponseMs = (existingWordStat.averageResponseMs + wordAvgResp) / 2;
      } else {
        existingWordStat.averageResponseMs = wordAvgResp;
      }

      existingWordStat.lastSeenAt = Date.now();

      // SLS Mastery Progress
      const currentMastery = existingWordStat.masteryScore ?? 0;
      let newMastery = currentMastery;
      const wordMistakes = target.mistakes || 0;
      if (wordMistakes === 0) {
        newMastery = Math.min(3, currentMastery + 1);
      } else {
        newMastery = Math.max(0, currentMastery - 1);
      }
      existingWordStat.masteryScore = newMastery;

      // SLS SRS Interval Scheduling
      const now = Date.now();
      let minutesToAdd = 1;
      let intervalDays = 0;
      if (newMastery === 1) {
        minutesToAdd = 5;
        intervalDays = 0.003;
      } else if (newMastery === 2) {
        minutesToAdd = 24 * 60; // 1 day
        intervalDays = 1;
      } else if (newMastery === 3) {
        minutesToAdd = 3 * 24 * 60; // 3 days
        intervalDays = 3;
      }
      existingWordStat.srsIntervalDays = intervalDays;
      existingWordStat.nextReviewTime = now + minutesToAdd * 60 * 1000;

      wordStatsMap[wKey] = existingWordStat;
      
      localStorage.setItem('typing_combat_word_stats', JSON.stringify(wordStatsMap));
    } catch {
      // LocalStorage full or safety fallback
    }

    setHudStats({ ...state.stats });
  };

  // 3. Main loop and Canvas Engine
  useEffect(() => {
    let animationId: number;
    let tickCount = 0;

    const handleRenderLoop = (currentTime: number) => {
      if (gamePhase === 'paused' || gamePhase === 'ended') {
        animationId = requestAnimationFrame(handleRenderLoop);
        return;
      }

      const canvas = canvasRef.current;
      const state = stateRef.current;

      state.gameTime = currentTime;

      // Update basic timers and spawning ONLY when active playing
      if (gamePhase === 'playing') {
        tickCount += 1;
        if (tickCount % 60 === 0) {
          state.stats.timeElapsed += 1;
          
          // Calculate WPM: (characters typed / 5) / minutes
          if (state.stats.timeElapsed > 0) {
            const minutes = state.stats.timeElapsed / 60;
            state.stats.wpm = Math.round((state.stats.accurateKeys / 5) / minutes);
          }

          // Slowly increase difficulty spawning intervals over time
          if (mode === 'endless') {
            if (level === 'Alphabet') {
              state.spawnInterval = Math.max(2000, 3500 - state.stats.score / 15);
            } else {
              state.spawnInterval = Math.max(1000, 2800 - state.stats.score / 15);
            }
          }

          // Time Attack 60s termination condition
          if (mode === 'time-attack' && state.stats.timeElapsed >= 60) {
            stopGame();
            return;
          }

          setHudStats({ ...state.stats });
        }

        // 1. Spawning Logic
        const maxActive = level === 'Alphabet' ? 4 : (trainingMode === 'learning' ? 3 : 99);
        const currentActive = state.aircrafts.filter(a => a.active).length;
        if (currentActive < maxActive && (currentTime - state.lastSpawnTime > state.spawnInterval)) {
          spawnWordAircraft();
          state.lastSpawnTime = currentTime;
        }
      } else if (gamePhase === 'ready') {
        // Keep spawn time fresh while waiting
        state.lastSpawnTime = currentTime;
      }

      const canvasWidth = window.innerWidth;
      const canvasHeight = window.innerHeight;

      // Initialize canvas dimension
      if (canvas && (canvas.width !== canvasWidth || canvas.height !== canvasHeight)) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        drawGameBoardCanvas(ctx, canvasWidth, canvasHeight, state, gameSettings);
      }

      // 2. Update Aircraft movements (represented as DOM elements but calculated positions in state)
      const playableWidth = canvasWidth - (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'right' ? 360 : 0);
      state.aircrafts.forEach((aircraft) => {
        if (!aircraft.active) return;

        // Calculate next positions with beautiful curves
        const { x, y, rotation } = updateAircraftPosition(
          aircraft,
          currentTime,
          playableWidth,
          canvasHeight
        );

        aircraft.x = x;
        aircraft.y = y;
        aircraft.rotation = rotation;

        // Check if aircraft breaches boundary (lands on shield)
        const currentShieldOffset = isMobileLayout ? 260 : (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'bottom' ? 180 : 110);
        const shieldLine = canvasHeight - currentShieldOffset;
        if (aircraft.y > shieldLine) {
          aircraft.active = false;
          
          if (state.lockedTargetId === aircraft.id) {
            state.lockedTargetId = null;
            setTypingCoachState({ activeWord: null, progress: 0 });
          }

          // Trigger base shields impact
          if (mode === 'endless') {
            const baseDamage = aircraft.isBoss ? 30 : 15;
            const damage = trainingMode === 'learning' ? Math.round(baseDamage / 2) : baseDamage;
            state.stats.shield = Math.max(0, state.stats.shield - damage);
            playMiss();

            // Set screen shake
            state.shakeTime = currentTime;
            setShakeClass('animate-shake border-2 border-cyber-magenta/40');
            setTimeout(() => setShakeClass(''), 400);

            // Spawn red blast particles at shield contact point
            spawnHitSpark(aircraft.x + aircraft.width / 2, shieldLine, '#ff0055');

            if (state.stats.shield <= 0) {
              stopGame();
              return;
            }
          }

          // Log failure
          const existingLog = state.wordLogs.find(w => w.word === aircraft.word);
          if (existingLog) {
            existingLog.success = false;
            existingLog.errors += 1;
            existingLog.attempts += 1;
          } else {
            state.wordLogs.push({
              word: aircraft.word,
              meaning: aircraft.meaning,
              emoji: aircraft.emoji,
              success: false,
              attempts: 1,
              errors: 1,
            });
          }

          // Save failed word learning stats in localStorage
          try {
            const statsSaved = localStorage.getItem('typing_combat_word_stats');
            let wordStatsMap: { [word: string]: WordLearningStats } = {};
            if (statsSaved) {
              try {
                wordStatsMap = JSON.parse(statsSaved) || {};
              } catch {
                // ignore
              }
            }

            const wKey = aircraft.word.toLowerCase();
            const existingWordStat = wordStatsMap[wKey] || {
              word: aircraft.word,
              attempts: 0,
              correctHits: 0,
              mistakes: 0,
              averageResponseMs: 0,
              lastSeenAt: 0,
            };

            existingWordStat.attempts += 1;
            // breached characters count as mistakes
            existingWordStat.mistakes += (aircraft.mistakes || 0) + (aircraft.word.length - aircraft.progress);
            existingWordStat.lastSeenAt = Date.now();
            
            wordStatsMap[wKey] = existingWordStat;
            localStorage.setItem('typing_combat_word_stats', JSON.stringify(wordStatsMap));
          } catch {
            // ignore
          }

          setHudStats({ ...state.stats });
        }
      });

      // Clear inactive aircrafts from array to free memory
      state.aircrafts = state.aircrafts.filter(a => a.active);

      animationId = requestAnimationFrame(handleRenderLoop);
    };

    animationId = requestAnimationFrame(handleRenderLoop);
    return () => cancelAnimationFrame(animationId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamePhase, mode, level, gameSettings]);

  // 4. Handle Spawning of new words
  function spawnWordAircraft() {
    const state = stateRef.current;
    if (wordPoolRef.current.length === 0) return;

    const canvasWidth = window.innerWidth;
    
    // Choose a random word entry
    const entryIndex = Math.floor(Math.random() * wordPoolRef.current.length);
    const entry = wordPoolRef.current[entryIndex];
    
    // Determine whether this word is a boss word
    const isBoss = mode === 'boss' && level !== 'Alphabet' && (entry.word.length >= 10 || Math.random() < 0.25);
    
    // Custom list boss selection: search for words in customWords with length >= 8
    const customLongWords = customWords && customWords.length > 0 
      ? customWords.filter(w => w.word.length >= 8)
      : [];

    let wordText = entry.word;
    if (isBoss) {
      if (customLongWords.length > 0) {
        wordText = customLongWords[Math.floor(Math.random() * customLongWords.length)].word;
      } else if (bossWordsRef.current.length > 0) {
        wordText = bossWordsRef.current[Math.floor(Math.random() * bossWordsRef.current.length)];
      } else {
        wordText = 'boss';
      }
    }
    
    let meaningText = getEntryMeaning(entry, lang);
    let emojiText = entry.emoji;
    if (isBoss) {
      const lookup = wordPoolRef.current.find(d => d.word.toLowerCase() === wordText.toLowerCase()) || 
                     (customWords && customWords.find(d => d.word.toLowerCase() === wordText.toLowerCase()));
      if (lookup) {
        meaningText = getEntryMeaning(lookup, lang);
        emojiText = lookup.emoji;
      } else {
        meaningText = lang === 'vi' ? 'Bá Chủ Không Phận' : '空の覇者';
        emojiText = '🛸';
      }
    }

    // Random spawning width
    const playableWidth = canvasWidth - (gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'right' ? 360 : 0);
    const spawnWidth = 140;
    const startX = Math.random() * (playableWidth - spawnWidth * 1.5) + spawnWidth * 0.5;
    const targetX = startX + (Math.random() * 100 - 50); // slight drift target
    
    const pathConfig = createRandomPathConfig(startX, isBoss);

    // Dynamic speeds depending on word length and setting multiplier
    // Longer words are slower to make them fair!
    const baseSpeed = isBoss ? 0.35 : Math.max(0.65, 1.45 - entry.word.length * 0.08);
    const learningMultiplier = trainingMode === 'learning' ? 0.7 : 1.0;
    const difficultyAdjustedSpeed = baseSpeed * 
                                    (1.0 + state.stats.score * 0.00025) * 
                                    gameSettings.aircraftSpeedMultiplier * 
                                    learningMultiplier;

    const newAircraft: WordAircraft = {
      id: Math.random().toString(),
      word: wordText,
      meaning: meaningText,
      emoji: emojiText,
      x: startX,
      y: -60, // spawn offscreen top
      width: spawnWidth,
      height: 40,
      speed: difficultyAdjustedSpeed,
      angle: 0,
      rotation: 0,
      targetX,
      targetY: window.innerHeight - gunYOffset,
      progress: getNextLetterProgress(wordText, 0),
      active: true,
      spawnTime: state.gameTime,
      ...pathConfig,
      isBoss,
      maxShields: isBoss ? 2 : undefined,
      shields: isBoss ? 2 : undefined,
    };

    state.aircrafts.push(newAircraft);
  };

  // Terminate and navigate to score recap screen
  function stopGame() {
    const state = stateRef.current;
    
    // Cache highscore statistics locally
    const saved = localStorage.getItem('typing_combat_lifetime_stats');
    let highStats = {
      highScore: 0,
      maxWpm: 0,
      maxCombo: 0,
      totalWords: 0,
      averageAccuracy: 0,
    };
    if (saved) {
      try { highStats = JSON.parse(saved); } catch { /* ignore */ }
    }

    highStats.highScore = Math.max(highStats.highScore, state.stats.score);
    highStats.maxWpm = Math.max(highStats.maxWpm, state.stats.wpm);
    highStats.maxCombo = Math.max(highStats.maxCombo, state.stats.maxCombo);
    highStats.totalWords += state.stats.wordsTyped;
    
    // Calculate new rolling average accuracy
    if (highStats.averageAccuracy > 0) {
      highStats.averageAccuracy = (highStats.averageAccuracy + state.stats.accuracy) / 2;
    } else {
      highStats.averageAccuracy = state.stats.accuracy;
    }

    localStorage.setItem('typing_combat_lifetime_stats', JSON.stringify(highStats));

    onGameOver(state.stats, state.wordLogs);
  };

  const activeAircrafts = stateRef.current.aircrafts.filter(a => a.active);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden select-none bg-cyber-bg transition-all duration-300 ${shakeClass}`}
    >
      {/* 1. Canvas overlay (particles, lasers, translations) */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* 2. Floating HTML Aircraft targets */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {activeAircrafts.map(aircraft => {
          const isLocked = stateRef.current.lockedTargetId === aircraft.id;
          
          return (
            <div
              key={aircraft.id}
              id={`aircraft-${aircraft.id}`}
              style={{
                position: 'absolute',
                left: `${aircraft.x}px`,
                top: `${aircraft.y}px`,
                transform: `rotate(${aircraft.rotation}rad)`,
                transition: 'transform 0.05s linear',
              }}
              className={`flex flex-col items-center select-none font-mono text-sm px-4 py-2 rounded-xl backdrop-blur-md transition-shadow duration-200 pointer-events-auto ${
                aircraft.isBoss 
                  ? isLocked
                    ? 'bg-cyber-magenta/25 border-2 border-cyber-magenta shadow-neon-magenta text-white' 
                    : 'bg-cyber-dark/80 border border-cyber-orange/60 text-cyber-orange'
                  : isLocked
                    ? trainingMode === 'learning'
                      ? 'bg-cyber-accent/40 border-2 border-cyber-green shadow-[0_0_20px_#00ff66] text-white scale-[1.1] animate-pulse'
                      : 'bg-cyber-accent/25 border-2 border-cyber-accent shadow-neon-cyan text-white scale-[1.05]'
                    : 'bg-cyber-dark/85 border border-cyber-accent/15 text-gray-300'
              }`}
            >
              {/* Aircraft Icon decoration */}
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-gray-400">
                {aircraft.isBoss ? (
                  <span className="flex items-center gap-1 font-bold text-cyber-orange neon-text-orange tracking-widest uppercase">
                    <Zap className="w-3 h-3 text-cyber-orange fill-cyber-orange animate-bounce" /> Boss Jet
                  </span>
                ) : (
                  <span className="opacity-60 flex items-center gap-1">
                    <Target className="w-2.5 h-2.5 text-cyber-accent" /> Glide Fighter
                  </span>
                )}
              </div>

              {/* Word Characters styling */}
              <div className="text-base md:text-lg font-bold tracking-widest uppercase">
                {/* Visual Highlight matching typed character index */}
                <span className="text-cyber-green neon-text-green font-extrabold">
                  {aircraft.word.slice(0, aircraft.progress)}
                </span>
                <span className="text-white">
                  {aircraft.word.slice(aircraft.progress)}
                </span>
              </div>

              {/* Translation hint when locked */}
              {isLocked && (
                <div className="text-[10px] mt-1 font-sans text-cyber-accent neon-text-cyan tracking-wide flex items-center gap-1">
                  <span>{t('targetLocked')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Space Fighter Player Ship */}
      <div 
        style={{
          left: gameSettings.typingCoach.enabled && gameSettings.typingCoach.position === 'right' 
            ? 'calc(50% - 180px)' 
            : '50%',
          bottom: `${shipOffset}px`,
          transform: `translateX(-50%) rotate(${stateRef.current.shipAngle}rad)`,
          transition: 'transform 0.08s ease-out',
          filter: `drop-shadow(0 0 10px ${{
            airplane: 'rgba(0, 243, 255, 0.8)',
            tank: 'rgba(255, 119, 0, 0.8)',
            butterfly: 'rgba(255, 0, 85, 0.8)',
            turtle: 'rgba(244, 63, 94, 0.8)'
          }[gameSettings.shooterType || 'airplane'] || 'rgba(0, 243, 255, 0.8)'})`
        }}
        className="absolute w-14 h-14 z-30 pointer-events-none select-none animate-float"
      >
        <img 
          src={`/assets/shooters/${gameSettings.shooterType || 'airplane'}.png`} 
          onError={(e) => {
            e.currentTarget.src = '/assets/shooters/airplane.png';
          }}
          className="w-full h-full object-contain max-w-full"
          alt="shooter"
        />
      </div>

      {/* Ship base station glowing deck */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-cyber-accent/40 to-transparent z-15 pointer-events-none" />

      {/* 4. Shield boundary warning line */}
      <div 
        style={{ bottom: `${shieldOffset}px` }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-magenta/30 to-transparent border-t border-dashed border-cyber-magenta/40 z-10 pointer-events-none"
      />

      {/* 5. In-Game HUD Interface */}
      <div className="absolute top-4 left-4 right-4 z-40 flex flex-col md:flex-row justify-between items-stretch md:items-start gap-2 md:gap-4 pointer-events-none">
        
        {/* Mobile-Only Minimal Compact HUD (Single Line) */}
        {isMobileLayout && (
          <div className="w-full flex justify-between items-center px-4 py-2 bg-cyber-dark/80 backdrop-blur-md border border-cyber-accent/30 rounded-2xl font-mono text-[10px] text-gray-300 pointer-events-auto shadow-[0_0_10px_rgba(0,242,255,0.1)] select-none gap-2">
            <div>
              <span className="text-cyber-orange font-bold">SCORE:</span> <span className="text-white font-extrabold">{hudStats.score}</span>
            </div>
            
            {mode === 'endless' && (
              <div className="flex items-center gap-1.5">
                <span className="text-cyber-green font-bold">SHIELD:</span>
                <span className={`font-extrabold ${hudStats.shield <= 30 ? 'text-cyber-magenta animate-pulse' : 'text-cyber-green'}`}>
                  {hudStats.shield}%
                </span>
              </div>
            )}
            
            <div>
              <span className="text-cyber-accent font-bold">TIME:</span> <span className="text-white font-extrabold">
                {mode === 'time-attack' 
                  ? `${Math.max(0, 60 - hudStats.timeElapsed)}s`
                  : `${Math.floor(hudStats.timeElapsed / 60)}:${(hudStats.timeElapsed % 60).toString().padStart(2, '0')}`
                }
              </span>
            </div>
          </div>
        )}

        {/* Left Side: Score & Core details */}
        <div className="hidden md:flex gap-4 items-center pointer-events-auto">
          <div className="glass-panel rounded-2xl px-4 py-2.5 font-mono text-center flex flex-col min-w-[100px]">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-center"><Award className="w-3 h-3 text-cyber-orange" /> {t('scoreHUD')}</span>
            <span className="text-xl font-black text-cyber-orange neon-text-orange">{hudStats.score}</span>
          </div>
          
          {/* Active WPM display */}
          <div className="glass-panel rounded-2xl px-4 py-2.5 font-mono text-center flex flex-col min-w-[80px]">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-center"><Sparkles className="w-3 h-3 text-cyber-accent" /> {t('speedHUD')}</span>
            <span className="text-lg font-bold text-cyber-accent neon-text-cyan">{hudStats.wpm} <span className="text-[10px] font-normal text-gray-400">wpm</span></span>
          </div>

          {/* Accuracy badge */}
          <div className="glass-panel rounded-2xl px-4 py-2.5 font-mono text-center flex flex-col min-w-[80px]">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-center"><Target className="w-3 h-3 text-cyber-magenta" /> {t('accuracyHUD')}</span>
            <span className="text-lg font-bold text-cyber-magenta neon-text-magenta">{hudStats.accuracy}%</span>
          </div>
        </div>

        {/* Center: Combos indicator */}
        {hudStats.combo >= 2 && trainingMode !== 'learning' && (
          <div className="absolute left-1/2 -translate-x-1/2 top-0 px-5 py-2.5 bg-gradient-to-r from-cyber-orange/10 via-cyber-orange/20 to-cyber-orange/10 border border-cyber-orange/30 rounded-2xl text-center pointer-events-auto shadow-neon-orange animate-bounce font-mono">
            <div className="text-[10px] text-cyber-orange neon-text-orange font-bold uppercase tracking-widest">{t('comboStreak')}</div>
            <div className="text-2xl font-black text-white">x{hudStats.combo}</div>
          </div>
        )}

        {/* Right Side: Shield indicators & Timers */}
        <div className="hidden md:flex gap-4 items-center pointer-events-auto ml-auto">
          
          {/* Level indicators */}
          <div className="glass-panel rounded-2xl px-4 py-2.5 font-mono text-center flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t('levelModeHUD')}</span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">{customWords.length > 0 ? t('customBadge') : level} <span className="text-[10px] font-normal text-gray-400">({mode})</span></span>
          </div>

          {/* Time Timer */}
          <div className="glass-panel rounded-2xl px-4 py-2.5 font-mono text-center flex flex-col min-w-[70px]">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{t('timeHUD')}</span>
            <span className="text-lg font-bold text-white">
              {mode === 'time-attack' 
                ? `${Math.max(0, 60 - hudStats.timeElapsed)}s`
                : `${Math.floor(hudStats.timeElapsed / 60)}:${(hudStats.timeElapsed % 60).toString().padStart(2, '0')}`
              }
            </span>
          </div>

          {/* Endless Shield Health bar */}
          {mode === 'endless' && (
            <div className="glass-panel rounded-2xl px-4 py-2 flex items-center gap-3">
              <div className="flex flex-col text-center">
                <span className="text-[9px] text-gray-400 uppercase tracking-widest flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-cyber-accent" /> {t('shieldHUD')}</span>
                <span className={`text-sm font-bold ${hudStats.shield <= 30 ? 'text-cyber-magenta neon-text-magenta animate-pulse' : 'text-cyber-green'}`}>{hudStats.shield}%</span>
              </div>
              <div className="w-24 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                <div 
                  style={{ width: `${hudStats.shield}%` }}
                  className={`h-full transition-all duration-300 ${
                    hudStats.shield <= 30 
                      ? 'bg-cyber-magenta shadow-[0_0_8px_rgba(255,0,85,0.8)]' 
                      : 'bg-cyber-green shadow-[0_0_8px_rgba(0,255,102,0.8)]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Action Buttons: Pause & Mute */}
          <div className="hidden md:flex gap-2">
            <button 
              onClick={handlePauseToggle}
              disabled={gamePhase === 'ready'}
              className={`p-2.5 bg-cyber-dark/80 border border-cyber-accent/30 rounded-xl text-cyber-accent hover:text-white transition-all transform active:scale-95 ${gamePhase === 'ready' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyber-accent/15'}`}
            >
              {gamePhase === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button 
              onClick={onBackToMenu}
              className="px-3 py-2.5 bg-red-950/20 hover:bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 hover:text-red-300 font-mono text-xs transition-all transform active:scale-95 cursor-pointer"
            >
              {t('exitButton')}
            </button>
          </div>

        </div>

      </div>

      {/* 6. Pause Overlay */}
      {gamePhase === 'paused' && (
        <div className="absolute inset-0 bg-cyber-bg/85 backdrop-blur-sm z-50 flex flex-col justify-center items-center select-none font-mono">
          <div className="glass-panel rounded-3xl p-8 max-w-sm text-center border-2 border-cyber-accent shadow-neon-cyan animate-float">
            <AlertCircle className="w-12 h-12 text-cyber-accent mx-auto mb-3 animate-pulse" />
            <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-cyber-accent mb-2">{t('pausedTitle')}</h2>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              {t('pausedDesc')}
            </p>
            <button 
              onClick={handlePauseToggle}
              className="w-full py-3 bg-gradient-to-r from-cyber-accent to-cyber-indigo text-white font-extrabold rounded-xl uppercase tracking-wider shadow-neon-cyan active:scale-95 transition-all cursor-pointer"
            >
              {t('pausedResume')}
            </button>
          </div>
        </div>
      )}

      {/* 8. Ready to Start Overlay */}
      {gamePhase === 'ready' && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 select-none font-mono pointer-events-none">
          <div className="glass-panel rounded-2xl p-4 text-center border border-cyber-accent/40 shadow-[0_0_15px_rgba(0,242,255,0.25)] bg-cyber-dark/80 backdrop-blur-sm pointer-events-auto animate-float flex flex-col items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-cyber-accent animate-pulse flex items-center gap-1.5 justify-center">
              <Target className="w-3.5 h-3.5 shrink-0 text-cyber-accent" /> {t('readyToStart')}
            </h2>
            <p className="text-[10px] text-gray-300 leading-relaxed font-semibold">
              {t('placeFingersThenPressSpace')}
            </p>
            
            {/* Spacebar key cap simulation animation */}
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="w-24 h-6 border-2 border-cyber-accent/40 bg-cyber-accent/10 hover:bg-cyber-accent/20 rounded-lg flex items-center justify-center text-[9px] font-extrabold text-white tracking-widest uppercase animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                SPACE
              </div>
              <span className="text-[8px] text-gray-500 uppercase">{t('pressSpaceToStart')}</span>
            </div>
          </div>
        </div>
      )}

      {/* 7. Typing Coach Panel overlay */}
      {gameSettings.typingCoach.enabled && (
        <TypingCoachPanel
          activeWord={typingCoachState.activeWord}
          progress={typingCoachState.progress}
          settings={gameSettings.typingCoach}
          uiLanguage={gameSettings.uiLanguage}
          onUpdateSettings={(newCoachSettings) => {
            if (onSetGameSettings) {
              onSetGameSettings({
                ...gameSettings,
                typingCoach: {
                  ...gameSettings.typingCoach,
                  ...newCoachSettings,
                },
              });
            }
          }}
          soundSettings={soundSettings}
          onTogglePronounce={onTogglePronounce}
          onSetPronunciationAccent={onSetPronunciationAccent}
        />
      )}

      {/* 9. Mobile QWERTY Virtual Keyboard */}
      {isMobileLayout && (gamePhase === 'playing' || gamePhase === 'ready') && (
        <div 
          className="absolute bottom-0 left-0 right-0 p-2 pb-safe z-40 bg-cyber-bg/95 backdrop-blur-md border-t border-cyber-accent/20 flex flex-col gap-1 select-none font-mono"
          style={{
            height: '240px',
            touchAction: 'none'
          }}
        >
          {/* Key Rows */}
          <div className="flex w-full justify-center">
            {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((key) => renderVirtualKey(key))}
          </div>
          <div className="flex w-full justify-center px-4">
            {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map((key) => renderVirtualKey(key))}
          </div>
          <div className="flex w-full justify-center px-10">
            {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map((key) => renderVirtualKey(key))}
          </div>
          
          {/* Control Row */}
          <div className="flex w-full justify-center px-2 mt-1">
            {/* Pause/Resume Button */}
            <button
              onTouchStart={(e) => {
                if (gamePhase === 'ready') return;
                setActiveVirtualKey('pause');
                e.preventDefault();
                handlePauseToggle();
              }}
              onTouchEnd={() => setActiveVirtualKey(null)}
              onMouseDown={(e) => {
                if (gamePhase === 'ready') return;
                setActiveVirtualKey('pause');
                e.preventDefault();
                handlePauseToggle();
              }}
              onMouseUp={() => setActiveVirtualKey(null)}
              onMouseLeave={() => setActiveVirtualKey(null)}
              className={`flex-1 h-12 mx-1 rounded-xl flex items-center justify-center font-bold text-xs gap-1 uppercase select-none transition-all cursor-pointer ${
                gamePhase === 'ready' ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                activeVirtualKey === 'pause'
                  ? 'bg-cyber-accent text-cyber-dark shadow-neon-cyan scale-95 border-cyber-accent'
                  : 'glass-panel text-cyber-accent hover:bg-cyber-accent/10 border-cyber-accent/25'
              }`}
              disabled={gamePhase === 'ready'}
            >
              <Pause className="w-3.5 h-3.5" />
              {'PAUSE'}
            </button>

            {/* SPACEBAR */}
            <button
              onTouchStart={(e) => {
                setActiveVirtualKey('space');
                handleVirtualKeyPress(e, ' ', true, 'Space');
              }}
              onTouchEnd={() => setActiveVirtualKey(null)}
              onMouseDown={(e) => {
                setActiveVirtualKey('space');
                handleVirtualKeyPress(e, ' ', true, 'Space');
              }}
              onMouseUp={() => setActiveVirtualKey(null)}
              onMouseLeave={() => setActiveVirtualKey(null)}
              className={`w-[45%] h-12 mx-1 rounded-xl flex items-center justify-center font-extrabold text-sm uppercase tracking-wider select-none transition-all cursor-pointer ${
                activeVirtualKey === 'space'
                  ? 'bg-cyber-accent text-cyber-dark shadow-neon-cyan scale-95 border-cyber-accent'
                  : 'glass-panel text-white hover:bg-cyber-accent/10 border-cyber-accent/25'
              }`}
            >
              SPACE
            </button>

            {/* EXIT Button */}
            <button
              onTouchStart={(e) => {
                setActiveVirtualKey('exit');
                e.preventDefault();
                onBackToMenu();
              }}
              onTouchEnd={() => setActiveVirtualKey(null)}
              onMouseDown={(e) => {
                setActiveVirtualKey('exit');
                e.preventDefault();
                onBackToMenu();
              }}
              onMouseUp={() => setActiveVirtualKey(null)}
              onMouseLeave={() => setActiveVirtualKey(null)}
              className={`flex-1 h-12 mx-1 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-wider select-none transition-all cursor-pointer ${
                activeVirtualKey === 'exit'
                  ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)] scale-95 border-red-600 font-black'
                  : 'glass-panel text-red-500 border-red-500/30 hover:bg-red-500/10 font-bold'
              }`}
            >
              {t('exitButton') || 'Exit'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
