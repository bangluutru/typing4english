import { useState, useEffect } from 'react';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import type { GameMode, GameStats, Language, Level, ReviewItem, GameSettings, CustomWordList, DictionaryEntry, TrainingMode } from '../../types/game';
import { useSound } from '../../hooks/useSound';
import { useTranslation } from '../../i18n/useTranslation';
import { CyberSkyBackground } from '../../components/CyberSkyBackground';
import { MainMenu } from '../../components/MainMenu';
import { GameBoard } from '../../components/GameBoard';
import { RecapScreen } from '../../components/RecapScreen';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';

type ScreenState = 'menu' | 'playing' | 'recap';

// Safe Game Settings Normalizer with Typing Coach migration safeguards
function normalizeGameSettings(saved: unknown): GameSettings {
  const s = saved as Partial<GameSettings> | null | undefined;
  // Migration: force showFullKeyboardDuringGame=true for users who had the old default (false)
  let showFullKB = s?.typingCoach?.showFullKeyboardDuringGame;
  const migrated = localStorage.getItem('_fullKBMigrated');
  if (showFullKB === false && !migrated) {
    showFullKB = true; // one-time migration from old default
    localStorage.setItem('_fullKBMigrated', '1');
  }

  return {
    aircraftSpeedMultiplier: Number(s?.aircraftSpeedMultiplier) || 1.0,
    meaningFadeSpeedMultiplier: Number(s?.meaningFadeSpeedMultiplier) || 1.0,
    meaningFontSizeMultiplier: Number(s?.meaningFontSizeMultiplier) || 1.0,
    uiLanguage: s?.uiLanguage ?? 'vi',
    typingCoach: {
      enabled: s?.typingCoach?.enabled ?? false,
      showVirtualKeyboard: s?.typingCoach?.showVirtualKeyboard ?? true,
      showFingerGuide: s?.typingCoach?.showFingerGuide ?? true,
      showNextKeyHint: s?.typingCoach?.showNextKeyHint ?? true,
      showHomeRowHint: s?.typingCoach?.showHomeRowHint ?? true,
      animationEnabled: s?.typingCoach?.animationEnabled ?? true,
      keyboardLayout: s?.typingCoach?.keyboardLayout ?? 'qwerty',
      position: s?.typingCoach?.position ?? 'bottom',
      overlayMode: s?.typingCoach?.overlayMode ?? 'auto',
      autoCollapse: s?.typingCoach?.autoCollapse ?? true,
      showFullKeyboardDuringGame: showFullKB ?? true,
      keyboardSize: Number(s?.typingCoach?.keyboardSize) || 100,
      keyboardOpacity: Number(s?.typingCoach?.keyboardOpacity) || 85,
    },
    vocabularyFilter: s?.vocabularyFilter ?? 'all',
    shooterType: s?.shooterType ?? 'airplane',
    theme: s?.theme ?? 'cyberpunk'
  };
}

interface WordBattleAppProps {
  onBackToHome: () => void;
  initialLevel?: Level | null;
}

export function WordBattleApp({ onBackToHome, initialLevel }: WordBattleAppProps) {
  // Synthesizer Audio hooks
  const {
    settings: soundSettings,
    initAudio,
    startAmbientDrone,
    stopAmbientDrone,
    playLaser,
    playHit,
    playMiss,
    playExplosion,
    playComboAlert,
    playLevelUp,
    toggleSfx,
    toggleMusic,
    setSfxVolume,
    setMusicVolume,
    speakWord,
    togglePronounce,
    setPronunciationAccent,
  } = useSound();

  const [screen, setScreen] = useState<ScreenState>('menu');
  const [selectedLevel, setSelectedLevel] = useState<Level>(initialLevel || 'Eiken 5 Kyu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('endless');
  const [selectedLang, setSelectedLang] = useState<Language>('vi');

  // New persistent Training Mode selection
  const [selectedTrainingMode, setSelectedTrainingMode] = useState<TrainingMode>(() => {
    try {
      const saved = localStorage.getItem('typing_adventure_wb_training_mode');
      if (saved === 'learning' || saved === 'battle') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'battle';
  });

  const setTrainingMode = (mode: TrainingMode) => {
    try {
      setSelectedTrainingMode(mode);
      localStorage.setItem('typing_adventure_wb_training_mode', mode);
    } catch {
      // ignore
    }
  };

  // Dynamic Scroll Lock effect to lock viewport strictly in playing mode only
  useEffect(() => {
    if (screen === 'playing') {
      document.body.classList.add('word-battle-active');
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('word-battle-active');
      document.documentElement.style.overflow = 'auto';
    }
    return () => {
      document.body.classList.remove('word-battle-active');
      document.documentElement.style.overflow = 'auto';
    };
  }, [screen]);

  // Ambient space drone music control - only play during active gameplay
  useEffect(() => {
    if (screen === 'playing' && soundSettings.musicEnabled) {
      initAudio();
      startAmbientDrone();
    } else {
      stopAmbientDrone();
    }
    return () => {
      stopAmbientDrone();
    };
  }, [screen, soundSettings.musicEnabled, initAudio, startAmbientDrone, stopAmbientDrone]);

  // Load / Save Game Settings
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('typing_adventure_wb_settings');
    if (saved) {
      try {
        return normalizeGameSettings(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    return normalizeGameSettings(null);
  });

  const handleSetGameSettings = (settings: GameSettings) => {
    setGameSettings(settings);
    localStorage.setItem('typing_adventure_wb_settings', JSON.stringify(settings));
  };

  // Dynamic Theme syncer
  useEffect(() => {
    document.body.setAttribute('data-theme', gameSettings.theme || 'cyberpunk');
    return () => {
      document.body.removeAttribute('data-theme');
    };
  }, [gameSettings.theme]);

  const t = useTranslation(gameSettings.uiLanguage);

  // Load / Save Custom Word Lists
  const [customWordLists, setCustomWordLists] = useState<CustomWordList[]>(() => {
    const saved = localStorage.getItem('typing_adventure_wb_custom_lists');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const saveCustomWordLists = (lists: CustomWordList[]) => {
    setCustomWordLists(lists);
    localStorage.setItem('typing_adventure_wb_custom_lists', JSON.stringify(lists));
  };

  const handleAddCustomList = (name: string, description?: string) => {
    const newList: CustomWordList = {
      id: Math.random().toString(),
      name,
      description,
      entries: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveCustomWordLists([...customWordLists, newList]);
  };

  const handleDeleteCustomList = (id: string) => {
    const updated = customWordLists.filter(l => l.id !== id);
    saveCustomWordLists(updated);
    if (selectedCustomListId === id) {
      setSelectedCustomListId(null);
    }
  };

  const handleAddWordToCustomList = (listId: string, entry: DictionaryEntry) => {
    const updated = customWordLists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          entries: [...l.entries, entry],
          updatedAt: Date.now(),
        };
      }
      return l;
    });
    saveCustomWordLists(updated);
  };

  const handleImportWordsToCustomList = (listId: string, entries: DictionaryEntry[]) => {
    const updated = customWordLists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          entries: [...l.entries, ...entries],
          updatedAt: Date.now(),
        };
      }
      return l;
    });
    saveCustomWordLists(updated);
  };

  // Word List Modifiers
  const handleEditWordInCustomList = (listId: string, index: number, updatedEntry: DictionaryEntry) => {
    const updated = customWordLists.map(l => {
      if (l.id === listId) {
        const newEntries = [...l.entries];
        newEntries[index] = updatedEntry;
        return {
          ...l,
          entries: newEntries,
          updatedAt: Date.now(),
        };
      }
      return l;
    });
    saveCustomWordLists(updated);
  };

  const handleDeleteWordFromCustomList = (listId: string, index: number) => {
    const updated = customWordLists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          entries: l.entries.filter((_, idx) => idx !== index),
          updatedAt: Date.now(),
        };
      }
      return l;
    });
    saveCustomWordLists(updated);
  };

  const handleClearWordsInCustomList = (listId: string) => {
    const updated = customWordLists.map(l => {
      if (l.id === listId) {
        return {
          ...l,
          entries: [],
          updatedAt: Date.now(),
        };
      }
      return l;
    });
    saveCustomWordLists(updated);
  };

  // Backup & Restore User Data
  const handleExportUserData = () => {
    try {
      const backupData = {
        settings: localStorage.getItem('typing_adventure_wb_settings'),
        customWordLists: localStorage.getItem('typing_adventure_wb_custom_lists'),
        lifetimeStats: localStorage.getItem('typing_adventure_wb_lifetime_stats'),
        wordStats: localStorage.getItem('typing_adventure_wb_word_stats'),
        trainingMode: localStorage.getItem('typing_adventure_wb_training_mode'),
        exportedAt: Date.now(),
        version: '1.0.0-beta',
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `typing_combat_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export user data:', e);
    }
  };

  const handleImportUserData = (dataStr: string): boolean => {
    try {
      const backup = JSON.parse(dataStr);
      if (!backup || typeof backup !== 'object') return false;

      // Basic validation: must have settings, customWordLists or lifetimeStats
      if (!('settings' in backup) && !('customWordLists' in backup) && !('lifetimeStats' in backup)) {
        return false;
      }

      // Restores settings
      if (backup.settings) {
        localStorage.setItem('typing_adventure_wb_settings', backup.settings);
        try {
          setGameSettings(normalizeGameSettings(JSON.parse(backup.settings)));
        } catch {
          // ignore
        }
      }

      // Restores custom word lists
      if (backup.customWordLists) {
        localStorage.setItem('typing_adventure_wb_custom_lists', backup.customWordLists);
        try {
          setCustomWordLists(JSON.parse(backup.customWordLists));
        } catch {
          // ignore
        }
      }

      // Restores lifetime stats
      if (backup.lifetimeStats) {
        localStorage.setItem('typing_adventure_wb_lifetime_stats', backup.lifetimeStats);
      }

      // Restores word learning stats
      if (backup.wordStats) {
        localStorage.setItem('typing_adventure_wb_word_stats', backup.wordStats);
      }

      // Restores training mode
      if (backup.trainingMode) {
        localStorage.setItem('typing_adventure_wb_training_mode', backup.trainingMode);
        if (backup.trainingMode === 'learning' || backup.trainingMode === 'battle') {
          setSelectedTrainingMode(backup.trainingMode);
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to import user data:', e);
      return false;
    }
  };

  const [selectedCustomListId, setSelectedCustomListId] = useState<string | null>(null);
  const [randomWords, setRandomWords] = useState<DictionaryEntry[]>([]);

  const handlePlayRandomWords = (words: DictionaryEntry[]) => {
    setRandomWords(words);
    setSelectedCustomListId('random-words');
    setScreen('playing');
  };

  // Review wave target storage
  const [reviewList, setReviewList] = useState<ReviewItem[]>([]);
  const [isReviewModeActive, setIsReviewModeActive] = useState(false);

  // In-game stats to review
  const [gameStats, setGameStats] = useState<GameStats>({
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

  const [sessionWordLogs, setSessionWordLogs] = useState<ReviewItem[]>([]);

  // Navigation handlers
  const handleStartGame = (lvl: Level, mode: GameMode, lang: Language, customListId?: string) => {
    setSelectedLevel(lvl);
    setSelectedMode(mode);
    setSelectedLang(lang);
    if (customListId) {
      setSelectedCustomListId(customListId);
    } else {
      setSelectedCustomListId(null);
    }
    setIsReviewModeActive(false);
    setScreen('playing');
  };

  const handleGameOver = (finalStats: GameStats, logs: ReviewItem[]) => {
    setGameStats(finalStats);
    setSessionWordLogs(logs);
    setScreen('recap');
  };

  const handleReplay = () => {
    initAudio();
    setScreen('playing');
  };

  const handleReviewMissed = (missedList: ReviewItem[]) => {
    initAudio();
    setReviewList(missedList);
    setIsReviewModeActive(true);
    setScreen('playing');
  };

  const handleBackToMenu = () => {
    initAudio();
    setIsReviewModeActive(false);
    setScreen('menu');
  };

  const activeCustomWords = selectedCustomListId === 'random-words'
    ? randomWords
    : selectedCustomListId
      ? customWordLists.find(l => l.id === selectedCustomListId)?.entries || []
      : [];

  return (
    <ErrorBoundary uiLanguage={gameSettings.uiLanguage} module="word-battle">
      <div className="relative w-full h-full select-none text-gray-100 font-sans antialiased crt-effect">
        {/* Dynamic scrolling universe backdrop */}
        <CyberSkyBackground />

        {/* Floating global Audio context gate (unlocks browser restrictions) */}
        <div className="fixed top-[60px] right-3 md:top-auto md:bottom-4 md:right-4 z-50 pointer-events-auto">
          <div className="glass-panel flex items-center gap-1.5 md:gap-2.5 px-2 py-1 md:px-3 md:py-2 rounded-2xl shadow-lg border border-cyber-accent/30 font-mono text-[10px] text-gray-400">
            <span className="hidden md:inline text-[9px] uppercase tracking-wider">{t('audioDeck')}</span>
            <button
              onClick={() => { initAudio(); toggleSfx(); }}
              className={`p-1 md:p-1.5 rounded-lg border transition-all ${
                soundSettings.sfxEnabled
                  ? 'border-cyber-green text-cyber-green bg-cyber-green/5'
                  : 'border-red-500/30 text-red-400 bg-red-950/20'
              }`}
              title={soundSettings.sfxEnabled ? 'SFX ON' : 'SFX OFF'}
            >
              {soundSettings.sfxEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            
            <button
              onClick={() => { initAudio(); toggleMusic(); }}
              className={`p-1 md:p-1.5 rounded-lg border transition-all ${
                soundSettings.musicEnabled
                  ? 'border-cyber-green text-cyber-green bg-cyber-green/5'
                  : 'border-red-500/30 text-red-400 bg-red-950/20'
              }`}
              title={soundSettings.musicEnabled ? 'BGM ON' : 'BGM OFF'}
            >
              <span className="font-bold text-[9px] md:text-xs">{soundSettings.musicEnabled ? t('bgmOn') : t('bgmOff')}</span>
            </button>
          </div>
        </div>

        {/* Keyboard warning header (only in game mode) */}
        {screen === 'playing' && (
          <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-cyber-magenta/10 border border-cyber-magenta/20 rounded-full text-[9px] text-cyber-magenta/70 font-mono uppercase tracking-wider animate-pulse">
              <AlertCircle className="w-3 h-3 text-cyber-magenta" /> {t('keyboardWarning')}
            </div>
          </div>
        )}

        {/* Screen Router State Container */}
        <div className="relative w-full h-full min-h-screen">
          {screen === 'menu' && (
            <MainMenu
              onStartGame={handleStartGame}
              soundSettings={soundSettings}
              onToggleSfx={toggleSfx}
              onToggleMusic={toggleMusic}
              onSetSfxVolume={setSfxVolume}
              onSetMusicVolume={setMusicVolume}
              onInitAudio={initAudio}
              playHit={playHit}
              playMiss={playMiss}
              playLevelUp={playLevelUp}
              gameSettings={gameSettings}
              onSetGameSettings={handleSetGameSettings}
              onTogglePronounce={togglePronounce}
              onSetPronunciationAccent={setPronunciationAccent}
              customWordLists={customWordLists}
              onAddCustomList={handleAddCustomList}
              onDeleteCustomList={handleDeleteCustomList}
              onAddWordToCustomList={handleAddWordToCustomList}
              onImportWordsToCustomList={handleImportWordsToCustomList}
              selectedCustomListId={selectedCustomListId}
              onSetSelectedCustomListId={setSelectedCustomListId}
              onEditWord={handleEditWordInCustomList}
              onDeleteWord={handleDeleteWordFromCustomList}
              onClearList={handleClearWordsInCustomList}
              onExportUserData={handleExportUserData}
              onImportUserData={handleImportUserData}
              trainingMode={selectedTrainingMode}
              onSetTrainingMode={setTrainingMode}
              randomWords={randomWords}
              onPlayRandomWords={handlePlayRandomWords}
              onBackToHome={onBackToHome}
            />
          )}

          {screen === 'playing' && (
            <GameBoard
              key={`${selectedLevel}-${selectedMode}-${selectedLang}-${activeCustomWords.length}`}
              level={selectedLevel}
              mode={selectedMode}
              lang={selectedLang}
              onGameOver={handleGameOver}
              onBackToMenu={handleBackToMenu}
              playLaser={playLaser}
              playHit={playHit}
              playMiss={playMiss}
              playExplosion={playExplosion}
              playComboAlert={playComboAlert}
              playLevelUp={playLevelUp}
              reviewList={reviewList}
              isReview={isReviewModeActive}
              gameSettings={gameSettings}
              onSetGameSettings={handleSetGameSettings}
              customWords={activeCustomWords}
              trainingMode={selectedTrainingMode}
              speakWord={speakWord}
              soundSettings={soundSettings}
              onTogglePronounce={togglePronounce}
              onSetPronunciationAccent={setPronunciationAccent}
            />
          )}

          {screen === 'recap' && (
            <RecapScreen
              stats={gameStats}
              wordLogs={sessionWordLogs}
              level={selectedLevel}
              lang={selectedLang}
              onReplay={handleReplay}
              onReviewMissed={handleReviewMissed}
              onBackToMenu={handleBackToMenu}
              gameSettings={gameSettings}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default WordBattleApp;
