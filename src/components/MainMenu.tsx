import React, { useState, useEffect, useCallback } from 'react';
import type { GameMode, Language, Level, SoundSettings, GameSettings, UILanguage, CustomWordList, DictionaryEntry, TrainingMode, FingerId, ShooterType } from '../types/game';
import { useTranslation } from '../i18n/useTranslation';
import { CustomWordListManager } from './CustomWordListManager';
import { KeyboardHandsOverlay } from '../typing-coach/components/KeyboardHandsOverlay';
import { SlsDictionaryExplorer } from './MainMenu/SlsDictionaryExplorer';
import { SettingsPanel } from './MainMenu/SettingsPanel';
import { fetchLevelData } from '../data/api';

interface MainMenuProps {
  onStartGame: (level: Level, mode: GameMode, lang: Language, customListId?: string) => void;
  soundSettings: SoundSettings;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onSetSfxVolume: (vol: number) => void;
  onSetMusicVolume: (vol: number) => void;
  onInitAudio: () => void;
  playHit?: () => void;
  playMiss?: () => void;
  playLevelUp?: () => void;
  gameSettings: GameSettings;
  onSetGameSettings: (settings: GameSettings) => void;
  onTogglePronounce?: () => void;
  onSetPronunciationAccent?: (accent: 'us' | 'uk') => void;
  customWordLists: CustomWordList[];
  onAddCustomList: (name: string, description?: string) => void;
  onDeleteCustomList: (id: string) => void;
  onAddWordToCustomList: (listId: string, entry: DictionaryEntry) => void;
  onImportWordsToCustomList: (listId: string, entries: DictionaryEntry[]) => void;
  selectedCustomListId: string | null;
  onSetSelectedCustomListId: (id: string | null) => void;
  onEditWord?: (listId: string, index: number, updatedEntry: DictionaryEntry) => void;
  onDeleteWord?: (listId: string, index: number) => void;
  onClearList?: (listId: string) => void;
  onExportUserData?: () => void;
  onImportUserData?: (dataStr: string) => boolean;
  trainingMode: TrainingMode;
  onSetTrainingMode: (mode: TrainingMode) => void;
  randomWords?: DictionaryEntry[];
  onPlayRandomWords?: (words: DictionaryEntry[]) => void;
  onBackToHome?: () => void;
}

const PRACTICE_KEYS = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', ' '];
const KEY_TO_FINGER: Record<string, FingerId> = {
  'a': 'left-pinky',
  's': 'left-ring',
  'd': 'left-middle',
  'f': 'left-index',
  'j': 'right-index',
  'k': 'right-middle',
  'l': 'right-ring',
  ';': 'right-pinky',
  ' ': 'right-thumb'
};

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  soundSettings,
  onToggleSfx,
  onToggleMusic,
  onSetSfxVolume,
  onSetMusicVolume,
  onInitAudio,
  playHit,
  playMiss,
  playLevelUp,
  gameSettings,
  onSetGameSettings,
  onTogglePronounce,
  onSetPronunciationAccent,
  customWordLists,
  onAddCustomList,
  onDeleteCustomList,
  onAddWordToCustomList,
  onImportWordsToCustomList,
  selectedCustomListId,
  onSetSelectedCustomListId,
  onEditWord,
  onDeleteWord,
  onClearList,
  onExportUserData,
  onImportUserData,
  trainingMode,
  onSetTrainingMode,
  randomWords = [],
  onPlayRandomWords,
  onBackToHome,
}) => {
  const t = useTranslation(gameSettings.uiLanguage);

  // Preload shooter images for smooth gameplay loading
  useEffect(() => {
    const assets = [
      '/assets/shooters/airplane.png',
      '/assets/shooters/tank.png',
      '/assets/shooters/butterfly.png',
      '/assets/shooters/turtle.png',
    ];
    assets.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const [selectedLevel, setSelectedLevel] = useState<Level>('Eiken 5 Kyu');
  const [selectedMode, setSelectedMode] = useState<GameMode>('endless');
  const [selectedLang, setSelectedLang] = useState<Language>('vi');
  const [customListActiveManagerId, setCustomListActiveManagerId] = useState<string | null>(null);
  const [showListManagerModal, setShowListManagerModal] = useState(false);
  const [showSlsDictionaryModal, setShowSlsDictionaryModal] = useState(false);
  const [showUserGuideModal, setShowUserGuideModal] = useState(false);
  const [randomCount, setRandomCount] = useState<number>(20);
  const [isRandomSelecting, setIsRandomSelecting] = useState<boolean>(false);

  const handlePlayRandomWords = async () => {
    onInitAudio();
    setIsRandomSelecting(true);
    try {
      const allLevelWords = await fetchLevelData(selectedLevel);
      if (allLevelWords && allLevelWords.length > 0) {
        const shuffled = [...allLevelWords].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, randomCount);
        if (onPlayRandomWords) {
          onPlayRandomWords(selected);
        }
      } else {
        alert("Không có từ nào trong cấp độ này để lựa chọn!");
      }
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi chọn từ ngẫu nhiên!");
    } finally {
      setIsRandomSelecting(false);
    }
  };
  interface WordStat {
    word: string;
    isStarred?: boolean;
    isSkipped?: boolean;
    masteryScore: number;
    nextReviewTime?: number;
    attempts: number;
    correctHits: number;
    mistakes: number;
    averageResponseMs: number;
    lastSeenAt: number;
  }

  const [statsMap, setStatsMap] = useState<Record<string, WordStat>>(() => {
    try {
      const saved = localStorage.getItem('typing_combat_word_stats');
      return saved ? JSON.parse(saved) || {} : {};
    } catch {
      return {};
    }
  });

  const [slsStats, setSlsStats] = useState(() => {
    try {
      const saved = localStorage.getItem('typing_combat_word_stats');
      if (saved) {
        const smap = JSON.parse(saved) || {};
        let starred = 0;
        let skipped = 0;
        let mastered = 0;
        let srsDue = 0;
        const now = Date.now();
        
        Object.values(smap).forEach((val) => {
          const stat = val as Partial<WordStat>;
          if (stat.isStarred) starred += 1;
          if (stat.isSkipped) skipped += 1;
          if (stat.masteryScore && stat.masteryScore >= 3) mastered += 1;
          if (stat.nextReviewTime && stat.nextReviewTime <= now && !stat.isSkipped) srsDue += 1;
        });
        
        return { starredCount: starred, skippedCount: skipped, masteredCount: mastered, srsDueCount: srsDue };
      }
    } catch {
      // ignore
    }
    return { starredCount: 0, skippedCount: 0, masteredCount: 0, srsDueCount: 0 };
  });

  const loadSlsStats = useCallback(() => {
    try {
      const saved = localStorage.getItem('typing_combat_word_stats');
      if (saved) {
        const smap = JSON.parse(saved) || {};
        let starred = 0;
        let skipped = 0;
        let mastered = 0;
        let srsDue = 0;
        const now = Date.now();
        
        Object.values(smap).forEach((val) => {
          const stat = val as Partial<WordStat>;
          if (stat.isStarred) starred += 1;
          if (stat.isSkipped) skipped += 1;
          if (stat.masteryScore && stat.masteryScore >= 3) mastered += 1;
          if (stat.nextReviewTime && stat.nextReviewTime <= now && !stat.isSkipped) srsDue += 1;
        });
        
        setSlsStats({ starredCount: starred, skippedCount: skipped, masteredCount: mastered, srsDueCount: srsDue });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // Refresh every 10 seconds in the menu asynchronously
    const interval = setInterval(loadSlsStats, 10000);
    return () => clearInterval(interval);
  }, [loadSlsStats]);

  const handleOpenSlsDictionary = () => {
    onInitAudio();
    try {
      const saved = localStorage.getItem('typing_combat_word_stats');
      setStatsMap(saved ? JSON.parse(saved) || {} : {});
    } catch {
      // ignore
    }
    loadSlsStats();
    setShowSlsDictionaryModal(true);
  };

  const handleToggleStar = (word: string) => {
    const wKey = word.toLowerCase();
    const updated = { ...statsMap };
    const current = updated[wKey] || {
      word,
      attempts: 0,
      correctHits: 0,
      mistakes: 0,
      averageResponseMs: 0,
      lastSeenAt: Date.now()
    };
    current.isStarred = !current.isStarred;
    updated[wKey] = current;
    setStatsMap(updated);
    localStorage.setItem('typing_combat_word_stats', JSON.stringify(updated));
    loadSlsStats(); // immediately update counts
  };

  const handleToggleSkip = (word: string) => {
    const wKey = word.toLowerCase();
    const updated = { ...statsMap };
    const current = updated[wKey] || {
      word,
      attempts: 0,
      correctHits: 0,
      mistakes: 0,
      averageResponseMs: 0,
      lastSeenAt: Date.now()
    };
    current.isSkipped = !current.isSkipped;
    updated[wKey] = current;
    setStatsMap(updated);
    localStorage.setItem('typing_combat_word_stats', JSON.stringify(updated));
    loadSlsStats(); // immediately update counts
  };



  const [isHomeRowPracticing, setIsHomeRowPracticing] = useState(false);
  const [practiceKeyIndex, setPracticeKeyIndex] = useState(0);
  const [practiceCompleted, setPracticeCompleted] = useState(false);

  useEffect(() => {
    if (!isHomeRowPracticing || practiceCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
      }

      const expectedKey = PRACTICE_KEYS[practiceKeyIndex];
      const typedKey = e.key.toLowerCase();

      if (typedKey === expectedKey) {
        if (playHit) {
          playHit();
        } else {
          onInitAudio();
        }
        
        if (practiceKeyIndex < PRACTICE_KEYS.length - 1) {
          setPracticeKeyIndex(prev => prev + 1);
        } else {
          setPracticeCompleted(true);
          if (playLevelUp) {
            playLevelUp();
          }
        }
      } else {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          if (playMiss) {
            playMiss();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHomeRowPracticing, practiceKeyIndex, practiceCompleted, playHit, playMiss, playLevelUp, onInitAudio]);

  // Load state stats
  const [stats] = useState(() => {
    const savedStats = localStorage.getItem('typing_combat_lifetime_stats');
    if (savedStats) {
      try {
        return JSON.parse(savedStats);
      } catch {
        // ignore
      }
    }
    return {
      highScore: 0,
      maxWpm: 0,
      maxCombo: 0,
      totalWords: 0,
      averageAccuracy: 0,
    };
  });

  const levels: { name: Level; desc: string }[] = [
    { name: 'Alphabet', desc: gameSettings.uiLanguage === 'vi' ? 'Học vị trí bàn phím và luyện gõ 10 ngón cơ bản.' : gameSettings.uiLanguage === 'ja' ? 'キーボード配列とタッチタイピングの基礎を学習。' : 'Learn keyboard positions and touch typing basics.' },
    { name: 'Kids', desc: 'Simple Words' },
    { name: 'Eiken 5 Kyu', desc: 'Eiken Grade 5' },
    { name: 'Eiken 4 Kyu', desc: 'Eiken Grade 4' },
    { name: 'Eiken 3 Kyu', desc: 'Eiken Grade 3' },
    { name: 'Eiken Pre 2 Kyu', desc: 'Eiken Grade Pre-2' },
    { name: 'Eiken 2 Kyu', desc: 'Eiken Grade 2' },
    { name: 'Eiken Pre 1 Kyu', desc: 'Eiken Grade Pre-1' },
    { name: 'Eiken 1 Kyu', desc: 'Eiken Grade 1' },
    { name: 'TOEIC', desc: 'TOEIC Exam' },
    { name: 'IELTS', desc: 'IELTS Academic' },
    { name: 'TOEFL', desc: 'TOEFL Academic' },
  ];

  const handlePlayClick = () => {
    onInitAudio();
    
    // Check if custom list is selected and empty
    if (selectedCustomListId) {
      const activeList = customWordLists.find(l => l.id === selectedCustomListId);
      if (!activeList || activeList.entries.length === 0) {
        alert(t('customWordListEmpty'));
        return;
      }
      onStartGame(selectedLevel, selectedMode, selectedLang, selectedCustomListId);
    } else {
      onStartGame(selectedLevel, selectedMode, selectedLang);
    }
  };

  const handleSetUILang = (lang: UILanguage) => {
    onSetGameSettings({
      ...gameSettings,
      uiLanguage: lang,
    });
  };

  const selectedCustomList = customWordLists.find(l => l.id === selectedCustomListId);

  return (
    <div className="min-h-screen md:h-screen w-screen flex flex-col font-body-md text-body-md overflow-y-auto md:overflow-hidden bg-background">
      
      {/* Top Navigation Area */}
      <header className="bg-surface-container/40 backdrop-blur-xl border-b border-outline-variant w-full px-margin-desktop py-2 flex justify-between items-center z-50 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>gamepad</span>
          <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">Arcade Educational Combat</span>
        </div>
        <nav className="hidden md:flex gap-6 select-none">
          <span className="font-label-caps text-label-caps text-primary-container border-b-2 border-primary-container pb-1 tracking-widest uppercase cursor-default">Hangar</span>
          <span 
            onClick={handleOpenSlsDictionary}
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary-container px-2 py-0.5 rounded tracking-widest uppercase cursor-pointer transition-colors"
          >
            Từ điển SLS ⭐️
          </span>
          <span 
            onClick={() => { onInitAudio(); setShowUserGuideModal(true); }}
            className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary-container px-2 py-0.5 rounded tracking-widest uppercase cursor-pointer transition-colors"
          >
            {t('userGuideNav')}
          </span>
          {onBackToHome && (
            <span 
              onClick={() => { onInitAudio(); onBackToHome(); }}
              className="font-label-caps text-label-caps text-critical-red hover:text-red-300 px-2 py-0.5 rounded tracking-widest uppercase cursor-pointer transition-colors flex items-center gap-1 font-bold"
            >
              <span className="material-symbols-outlined text-[14px]">home</span>
              Thoát game (Home)
            </span>
          )}
        </nav>
        <div className="flex gap-2">
          {/* Settings overlay toggle */}
          <button 
            onClick={() => { onInitAudio(); setShowListManagerModal(true); }}
            aria-label="Settings" 
            className="text-on-surface-variant hover:text-primary hover:bg-primary/10 p-1 rounded transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <button 
            disabled 
            aria-label="Account" 
            title={t('comingLater')}
            className="text-on-surface-variant opacity-40 p-1 rounded cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow w-full max-w-[1920px] mx-auto px-margin-desktop py-gutter flex flex-col md:flex-row gap-gutter overflow-y-auto md:overflow-hidden">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-gutter h-auto md:h-full pb-8 md:pb-0">
          
          {/* Left Column: Branding, Mission & Vocab */}
          <div className="flex flex-col gap-gutter h-auto md:h-full overflow-visible md:overflow-hidden">
            {/* Brand */}
            <div className="flex flex-col mb-2 flex-shrink-0">
              <h1 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tighter drop-shadow-[0_0_8px_rgba(0,242,255,0.8)] neon-text-primary uppercase leading-tight">Typing Air Battle</h1>
              <p className="font-mono-data text-[10px] text-on-surface-variant mt-1 tracking-widest">{t('appSubtitle')}</p>
            </div>

            {/* Panel 1: Mission Selection (Level Selector) */}
            <div className="glass-panel rounded-xl p-panel-padding glass-panel-glow flex flex-col flex-shrink-0">
              <div className="flex items-center justify-between mb-3 border-b border-outline-variant pb-1 flex-shrink-0">
                <div className="flex items-center gap-2 text-primary-container">
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest">{t('selectLevel')}</h3>
                </div>
                {selectedCustomListId ? (
                  <span className="px-2 py-0.5 bg-cyber-magenta/15 border border-cyber-magenta/40 text-cyber-magenta rounded text-[9px] font-bold neon-text-magenta animate-pulse">
                    {selectedCustomListId === 'random-words'
                      ? `Ngẫu nhiên ${randomWords?.length || 0} từ`
                      : `${t('customBadge')} ${selectedCustomList?.name}`}
                  </span>
                ) : (
                  <span className="font-mono-data text-[10px] text-on-surface-variant">{selectedLevel} Loaded</span>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {levels.map(lvl => {
                  const isSelected = selectedLevel === lvl.name && !selectedCustomListId;
                  return (
                    <button 
                      key={lvl.name}
                      onClick={() => {
                        onInitAudio();
                        setSelectedLevel(lvl.name);
                        onSetSelectedCustomListId(null);
                      }}
                      className={`cyber-border rounded p-2 text-left transition-colors group relative cursor-pointer ${
                        isSelected ? 'bg-primary-container/10 active' : 'bg-surface/50 hover:bg-primary/5'
                      }`}
                      title={lvl.desc}
                    >
                      {isSelected && (
                        <span className="absolute top-1 right-1 material-symbols-outlined text-primary-container text-[12px]">check_box</span>
                      )}
                      <h4 className={`font-mono-data text-[12px] font-bold ${isSelected ? 'text-primary-container' : 'text-primary group-hover:text-primary-container'}`}>
                        {lvl.name}
                      </h4>
                    </button>
                  );
                })}
              </div>

              {/* Random Word Selector Section */}
              <div className="mt-3 border-t border-outline-variant/30 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-primary-container font-mono-data font-bold">
                    <span className="material-symbols-outlined text-[14px]">casino</span>
                    <span>LỰA CHỌN TỪ NGẪU NHIÊN</span>
                  </div>
                  <span className="text-[9px] text-on-surface-variant font-mono">Từ {selectedLevel}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <select 
                    value={randomCount} 
                    onChange={(e) => setRandomCount(Number(e.target.value))}
                    className="flex-grow bg-cyber-dark border border-outline-variant rounded p-1.5 text-xs text-primary focus:border-primary-container outline-none transition-colors"
                  >
                    <option value={5}>5 từ ngẫu nhiên</option>
                    <option value={10}>10 từ ngẫu nhiên</option>
                    <option value={20}>20 từ ngẫu nhiên</option>
                    <option value={30}>30 từ ngẫu nhiên</option>
                    <option value={50}>50 từ ngẫu nhiên</option>
                    <option value={100}>100 từ ngẫu nhiên</option>
                  </select>
                  <button
                    type="button"
                    disabled={isRandomSelecting}
                    onClick={handlePlayRandomWords}
                    className="px-4 py-1.5 bg-gradient-to-r from-cyber-accent to-cyber-indigo text-white font-bold font-mono-data text-[10px] uppercase rounded hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[12px]">{isRandomSelecting ? 'sync' : 'play_arrow'}</span>
                    <span>{isRandomSelecting ? 'Đang chọn...' : 'Chọn Từ'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Panel 4: Word Forge (Compact Custom Word Lists) */}
            <div className="glass-panel rounded-xl p-panel-padding flex flex-col flex-grow overflow-hidden">
              <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 text-primary-container">
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest">Danh Sách Từ Riêng</h3>
                </div>
                <span className="font-mono-data text-[10px] text-on-surface-variant">{customWordLists.length} Lists</span>
              </div>
              
              <div className="flex flex-col gap-3 flex-grow overflow-hidden">
                {/* Creation Form - Very Compact */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem('listName') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    onAddCustomList(input.value.trim());
                    input.value = '';
                  }
                }} className="space-y-2 flex-shrink-0">
                  <div className="flex gap-2">
                    <input 
                      name="listName"
                      className="flex-1 bg-surface-dim border border-outline-variant rounded p-1.5 text-xs text-primary focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors placeholder:text-outline" 
                      placeholder="Tên danh sách..." 
                      type="text"
                      required
                    />
                    <button type="submit" className="bg-surface-dim border border-primary-container/50 text-primary-container font-mono-data text-[10px] px-2.5 rounded hover:bg-primary-container/10 transition-colors flex items-center justify-center cursor-pointer">
                      <span className="material-symbols-outlined text-[14px]">add</span>
                    </button>
                  </div>
                </form>

                {/* Lists selection drawer */}
                {customWordLists.length === 0 ? (
                  <div className="flex-grow border border-dashed border-outline-variant rounded-lg flex flex-col items-center justify-center p-4 text-center bg-surface/30">
                    <span className="material-symbols-outlined text-2xl text-outline-variant mb-2">help</span>
                    <h4 className="font-mono-data text-[10px] text-on-surface-variant uppercase mb-1">Chưa có danh mục</h4>
                    <p className="font-body-md text-[10px] text-on-surface-variant/70 leading-tight">Hãy tạo danh sách từ riêng bằng form phía trên.</p>
                  </div>
                ) : (
                  <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1.5">
                    {customWordLists.map(list => {
                      const isSelected = selectedCustomListId === list.id;
                      return (
                        <div 
                          key={list.id}
                          className={`flex items-center justify-between p-2 rounded border transition-colors ${
                            isSelected ? 'border-primary bg-primary-container/15' : 'border-outline-variant/30 bg-surface/50 hover:bg-primary/5'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onInitAudio();
                              onSetSelectedCustomListId(isSelected ? null : list.id);
                            }}
                            className="flex-grow text-left font-mono-data text-xs text-primary truncate uppercase"
                          >
                            {list.name} <span className="text-[10px] text-gray-500 font-sans">({list.entries.length} w)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(t('deleteConfirm'))) {
                                onDeleteCustomList(list.id);
                              }
                            }}
                            className="text-critical-red hover:text-red-300 ml-2"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Open full Custom Lists Manager Cockpit overlay */}
                <button
                  type="button"
                  onClick={() => { onInitAudio(); setShowListManagerModal(true); }}
                  className="w-full py-2 bg-gradient-to-r from-primary-container to-secondary-container text-background font-bold font-mono-data text-[10px] tracking-wider uppercase rounded hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  Quản lý & File Import
                </button>
              </div>
            </div>
          </div>

          {/* Center Column: Hero Action & Game Modes */}
          <div className="flex flex-col gap-gutter h-auto md:h-full overflow-visible md:overflow-y-auto custom-scrollbar pr-0.5 md:pr-1.5">
            {/* Hero Action Button */}
            <div className="flex-shrink-0">
              <button 
                onClick={handlePlayClick}
                className="w-full hero-btn text-background rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:scale-[1.01] transition-transform duration-200 shadow-[0_0_20px_rgba(0,242,255,0.3)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[48px] text-background animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                <div className="text-center">
                  <h2 className="font-headline-lg text-[28px] font-bold uppercase tracking-widest text-background leading-tight">{t('playButton')}</h2>
                  <span className="font-label-caps text-label-caps uppercase opacity-80 mt-1 block text-background">{t('playSub')}</span>
                </div>
              </button>
            </div>

            {/* Home Row Practice Quick Entry */}
            <div className="flex-shrink-0">
              <button 
                onClick={() => {
                  onInitAudio();
                  setPracticeKeyIndex(0);
                  setPracticeCompleted(false);
                  setIsHomeRowPracticing(true);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-cyber-indigo/25 to-cyber-accent/25 hover:from-cyber-indigo/40 hover:to-cyber-accent/40 border border-cyber-accent/30 hover:border-cyber-accent rounded-xl text-cyber-accent hover:text-white font-bold font-mono-data text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">school</span>
                {t('practiceHomeRow')}
              </button>
            </div>

            {/* Panel 2: Game Mode Selection */}
            <div className="glass-panel rounded-xl p-panel-padding flex-shrink-0">
              <div className="flex items-center gap-2 text-primary-container mb-3 border-b border-outline-variant pb-1">
                <span className="material-symbols-outlined text-[16px]">timer</span>
                <h3 className="font-label-caps text-label-caps uppercase tracking-widest">{t('selectMode')}</h3>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'endless' as GameMode, label: t('endlessMode'), desc: t('endlessModeDesc'), icon: 'shield' },
                  { id: 'time-attack' as GameMode, label: t('timeAttackMode'), desc: t('timeAttackModeDesc'), icon: 'schedule' },
                  { id: 'boss' as GameMode, label: t('bossMode'), desc: t('bossModeDesc'), icon: 'star' },
                ].map(m => {
                  const isSelected = selectedMode === m.id;
                  return (
                    <button 
                      key={m.id}
                      onClick={() => { onInitAudio(); setSelectedMode(m.id); }}
                      className={`cyber-border rounded p-2 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-primary-container/10 active' : 'bg-surface/50 hover:bg-primary/5 opacity-70'
                      }`}
                    >
                      <span className={`material-symbols-outlined mt-0.5 text-[18px] ${isSelected ? 'text-primary-container' : 'text-on-surface-variant'}`}>{m.icon}</span>
                      <div>
                        <h4 className={`font-mono-data text-[12px] font-bold leading-none mb-1 ${isSelected ? 'text-primary-container' : 'text-primary'}`}>{m.label}</h4>
                        <p className="font-body-md text-[10px] text-on-surface-variant leading-tight">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel 3: Display Configs (Translation and UI languages) */}
            <div className="glass-panel rounded-xl p-panel-padding flex-grow flex flex-col justify-between">
              <div className="mb-4">
                <div className="flex items-center gap-2 text-primary-container mb-2 border-b border-outline-variant pb-1">
                  <span className="material-symbols-outlined text-[16px]">translate</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest">{t('meaningLanguage')}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { onInitAudio(); setSelectedLang('vi'); }}
                    className={`cyber-border flex-1 rounded py-1.5 px-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedLang === 'vi' ? 'bg-primary-container/10 active' : 'bg-surface/50 hover:bg-primary/5 opacity-60'
                    }`}
                  >
                    <span className="text-xs">🇻🇳</span> <span className={`font-mono-data text-[10px] font-bold ${selectedLang === 'vi' ? 'text-primary-container' : 'text-on-surface-variant'}`}>{t('vietnamese')}</span>
                  </button>
                  <button 
                    onClick={() => { onInitAudio(); setSelectedLang('ja'); }}
                    className={`cyber-border flex-1 rounded py-1.5 px-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      selectedLang === 'ja' ? 'bg-primary-container/10 active' : 'bg-surface/50 hover:bg-primary/5 opacity-60'
                    }`}
                  >
                    <span className="text-xs">🇯🇵</span> <span className={`font-mono-data text-[10px] font-bold ${selectedLang === 'ja' ? 'text-primary-container' : 'text-on-surface-variant'}`}>{t('japanese')}</span>
                  </button>
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-primary-container mb-2 border-b border-outline-variant pb-1">
                  <span className="material-symbols-outlined text-[16px]">language</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest">{t('uiLanguage')}</h3>
                </div>
                <div className="flex gap-2 mb-4">
                  {[
                    { code: 'vi' as UILanguage, label: 'VI', emoji: '🇻🇳' },
                    { code: 'en' as UILanguage, label: 'EN', emoji: '🇺🇸' },
                    { code: 'ja' as UILanguage, label: 'JA', emoji: '🇯🇵' },
                  ].map(lang => {
                    const isSelected = gameSettings.uiLanguage === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => { onInitAudio(); handleSetUILang(lang.code); }}
                        className={`cyber-border flex-1 rounded py-1.5 px-2 flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected ? 'bg-primary-container/10 active' : 'bg-surface/50 hover:bg-primary/5 opacity-60'
                        }`}
                      >
                        <span className="text-[10px]">{lang.emoji}</span> 
                        <span className={`font-mono-data text-[10px] font-bold ${isSelected ? 'text-primary-container' : 'text-on-surface-variant'}`}>{lang.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-3">
                <div className="flex items-center gap-2 text-primary-container mb-2 border-b border-outline-variant pb-1">
                  <span className="material-symbols-outlined text-[16px]">palette</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest">Giao diện (Theme)</h3>
                </div>
                <div className="flex gap-2 mb-4">
                  {[
                    { id: 'cyberpunk', label: 'Cyberpunk (Bé trai 👦)', emoji: '🌌' },
                    { id: 'magical', label: 'Magical (Bé gái 👧)', emoji: '💖' },
                  ].map(themeOpt => {
                    const isSelected = (gameSettings.theme || 'cyberpunk') === themeOpt.id;
                    return (
                      <button
                        key={themeOpt.id}
                        type="button"
                        onClick={() => {
                          onInitAudio();
                          onSetGameSettings({
                            ...gameSettings,
                            theme: themeOpt.id as 'cyberpunk' | 'magical'
                          });
                        }}
                        className={`cyber-border flex-1 rounded py-1.5 px-2 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected ? 'bg-primary-container/10 active' : 'bg-surface/50 hover:bg-primary/5 opacity-60'
                        }`}
                      >
                        <span className="text-[10px]">{themeOpt.emoji}</span> 
                        <span className={`font-mono-data text-[10px] font-bold ${isSelected ? 'text-primary-container' : 'text-on-surface-variant'}`}>{themeOpt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-3">
                <div className="flex items-center gap-2 text-primary-container mb-2 border-b border-outline-variant pb-1">
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest">{t('selectTrainingMode')}</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    type="button"
                    onClick={() => { onInitAudio(); onSetTrainingMode('learning'); }}
                    className={`cyber-border flex-1 rounded p-2 text-left transition-all cursor-pointer ${
                      trainingMode === 'learning' ? 'bg-primary-container/10 active border-primary' : 'bg-surface/50 hover:bg-primary/5 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`material-symbols-outlined text-[14px] ${trainingMode === 'learning' ? 'text-primary-container' : 'text-on-surface-variant'}`}>school</span>
                      <h4 className={`font-mono-data text-[10px] font-bold ${trainingMode === 'learning' ? 'text-primary-container' : 'text-primary'}`}>{t('learningMode')}</h4>
                    </div>
                    <p className="font-body-md text-[9px] text-on-surface-variant leading-tight">{t('learningModeDesc')}</p>
                  </button>
                  <button 
                    type="button"
                    onClick={() => { onInitAudio(); onSetTrainingMode('battle'); }}
                    className={`cyber-border flex-1 rounded p-2 text-left transition-all cursor-pointer ${
                      trainingMode === 'battle' ? 'bg-primary-container/10 active border-primary' : 'bg-surface/50 hover:bg-primary/5 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`material-symbols-outlined text-[14px] ${trainingMode === 'battle' ? 'text-primary-container' : 'text-on-surface-variant'}`}>rocket_launch</span>
                      <h4 className={`font-mono-data text-[10px] font-bold ${trainingMode === 'battle' ? 'text-primary-container' : 'text-primary'}`}>{t('battleMode')}</h4>
                    </div>
                    <p className="font-body-md text-[9px] text-on-surface-variant leading-tight">{t('battleModeDesc')}</p>
                  </button>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-3 mt-3">
                <div className="flex items-center gap-2 text-primary-container mb-2 border-b border-outline-variant pb-1">
                  <span className="material-symbols-outlined text-[16px]">palette</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest">{t('selectShooter')}</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Cyber Adventure Shooters Section */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-cyber-accent font-black tracking-wider uppercase font-mono">🛸 Phiêu lưu Không gian / Cyber Shooters</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'airplane', name: t('shooterAirplane'), img: '/assets/shooters/airplane.png', glow: 'hover:shadow-[0_0_12px_rgba(0,242,255,0.4)] border-cyber-accent', activeGlow: 'border-cyber-accent bg-cyber-accent/10 shadow-[0_0_15px_#00f3ff]' },
                        { id: 'tank', name: t('shooterTank'), img: '/assets/shooters/tank.png', glow: 'hover:shadow-[0_0_12px_rgba(255,119,0,0.4)] border-cyber-orange', activeGlow: 'border-cyber-orange bg-cyber-orange/10 shadow-[0_0_15px_#ff7700]' },
                      ].map(s => {
                        const isSelected = (gameSettings.shooterType || 'airplane') === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onInitAudio();
                              onSetGameSettings({
                                ...gameSettings,
                                shooterType: s.id as ShooterType
                              });
                            }}
                            className={`flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected ? s.activeGlow + ' scale-[1.03]' : 'border-outline-variant/30 bg-surface/50 opacity-60 ' + s.glow
                            }`}
                            title={s.name}
                          >
                            <div className="w-10 h-10 flex items-center justify-center mb-1">
                              <img src={s.img} className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" alt={s.id} />
                            </div>
                            <span className="text-[8px] text-center font-bold tracking-tighter truncate w-full text-white uppercase">{s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Magical Adventure Shooters Section */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-cyber-magenta font-black tracking-wider uppercase font-mono">💖 Phiêu lưu Phép màu / Magical Shooters</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'butterfly', name: t('shooterButterfly'), img: '/assets/shooters/butterfly.png', glow: 'hover:shadow-[0_0_12px_rgba(255,0,85,0.4)] border-cyber-magenta', activeGlow: 'border-cyber-magenta bg-cyber-magenta/10 shadow-[0_0_15px_#ff0055]' },
                        { id: 'turtle', name: t('shooterTurtle'), img: '/assets/shooters/turtle.png', glow: 'hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] border-pink-400', activeGlow: 'border-pink-500 bg-pink-500/10 shadow-[0_0_15px_#f43f5e]' },
                      ].map(s => {
                        const isSelected = (gameSettings.shooterType || 'airplane') === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onInitAudio();
                              onSetGameSettings({
                                ...gameSettings,
                                shooterType: s.id as ShooterType
                              });
                            }}
                            className={`flex flex-col items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected ? s.activeGlow + ' scale-[1.03]' : 'border-outline-variant/30 bg-surface/50 opacity-60 ' + s.glow
                            }`}
                            title={s.name}
                          >
                            <div className="w-10 h-10 flex items-center justify-center mb-1">
                              <img src={s.img} className="w-full h-full object-contain filter drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" alt={s.id} />
                            </div>
                            <span className="text-[8px] text-center font-bold tracking-tighter truncate w-full text-white uppercase">{s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-outline-variant/30 pt-3 mt-3">
                <div className="flex items-center gap-2 text-primary-container mb-2 border-b border-outline-variant pb-1">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest">Luyện Tập Thông Minh (SLS)</h3>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
                  <button
                    type="button"
                    onClick={() => {
                      onInitAudio();
                      onSetGameSettings({ ...gameSettings, vocabularyFilter: 'all' });
                    }}
                    className={`p-2 rounded border transition-all text-left cursor-pointer flex flex-col justify-between h-10 ${
                      gameSettings.vocabularyFilter === 'all' || !gameSettings.vocabularyFilter
                        ? 'border-primary bg-primary-container/10 text-primary-container font-bold shadow-[0_0_5px_rgba(0,242,255,0.15)]'
                        : 'border-outline-variant/40 bg-surface/50 hover:bg-primary/5 text-gray-400'
                    }`}
                  >
                    <span>🚀 TẤT CẢ TỪ VỰNG</span>
                    <span className="text-[7px] text-on-surface-variant/80 uppercase font-normal">Chơi toàn bộ kho từ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onInitAudio();
                      onSetGameSettings({ ...gameSettings, vocabularyFilter: 'starred' });
                    }}
                    className={`p-2 rounded border transition-all text-left cursor-pointer flex flex-col justify-between h-10 ${
                      gameSettings.vocabularyFilter === 'starred'
                        ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400 font-bold shadow-[0_0_5px_rgba(250,204,21,0.15)]'
                        : 'border-outline-variant/40 bg-surface/50 hover:bg-primary/5 text-gray-400'
                    }`}
                  >
                    <span>⭐ TỪ CẦN ÔN ({slsStats.starredCount})</span>
                    <span className="text-[7px] text-on-surface-variant/80 uppercase font-normal">Chỉ luyện từ gắn sao</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onInitAudio();
                      onSetGameSettings({ ...gameSettings, vocabularyFilter: 'exclude-mastered' });
                    }}
                    className={`p-2 rounded border transition-all text-left cursor-pointer flex flex-col justify-between h-10 ${
                      gameSettings.vocabularyFilter === 'exclude-mastered'
                        ? 'border-cyber-green bg-cyber-green/10 text-cyber-green font-bold shadow-[0_0_5px_rgba(0,255,102,0.15)]'
                        : 'border-outline-variant/40 bg-surface/50 hover:bg-primary/5 text-gray-400'
                    }`}
                  >
                    <span>🎓 CHƯA THUỘC</span>
                    <span className="text-[7px] text-on-surface-variant/80 uppercase font-normal">{slsStats.masteredCount} từ đã gõ tốt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onInitAudio();
                      onSetGameSettings({ ...gameSettings, vocabularyFilter: 'srs' });
                    }}
                    className={`p-2 rounded border transition-all text-left cursor-pointer flex flex-col justify-between h-10 ${
                      gameSettings.vocabularyFilter === 'srs'
                        ? 'border-cyber-accent bg-cyber-accent/10 text-cyber-accent font-bold shadow-[0_0_5px_rgba(0,243,255,0.15)]'
                        : 'border-outline-variant/40 bg-surface/50 hover:bg-primary/5 text-gray-400'
                    }`}
                  >
                    <span>🧠 ÔN TẬP SRS ({slsStats.srsDueCount})</span>
                    <span className="text-[7px] text-on-surface-variant/80 uppercase font-normal">{slsStats.srsDueCount} từ đến hạn ôn</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Audio/Speed Controls */}
          <div className="flex flex-col gap-gutter h-auto md:h-full overflow-visible md:overflow-y-auto custom-scrollbar pr-0.5 md:pr-1.5">
            {/* Stats Sidebar Content (Pilot Dossier) */}
            <div className="glass-panel rounded-xl p-panel-padding flex flex-col flex-shrink-0">
              <div className="flex items-center gap-2 text-primary-container border-b border-outline-variant pb-2 mb-3 flex-shrink-0">
                <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                <h3 className="font-label-caps text-label-caps uppercase tracking-widest">{t('statsTitle')}</h3>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* High Score */}
                <div className="bg-surface-dim/50 border border-outline-variant/50 rounded p-2 text-center flex flex-col justify-center h-16 cyber-border hover:bg-surface-variant/20 transition-colors">
                  <span className="font-mono-data text-[8px] text-on-surface-variant uppercase mb-1">{t('statsHighScore')}</span>
                  <span className="font-headline-md text-secondary-container font-bold neon-text-secondary leading-none">{stats.highScore}</span>
                </div>
                {/* Max WPM */}
                <div className="bg-surface-dim/50 border border-outline-variant/50 rounded p-2 text-center flex flex-col justify-center h-16 cyber-border hover:bg-surface-variant/20 transition-colors">
                  <span className="font-mono-data text-[8px] text-on-surface-variant uppercase mb-1">{t('statsMaxWpm')}</span>
                  <span className="font-headline-md text-tertiary-container font-bold drop-shadow-[0_0_8px_rgba(255,75,137,0.5)] text-[#ff4b89] leading-none">{stats.maxWpm}</span>
                </div>
                {/* Max Combo */}
                <div className="bg-surface-dim/50 border border-outline-variant/50 rounded p-2 text-center flex flex-col justify-center h-16 cyber-border hover:bg-surface-variant/20 transition-colors">
                  <span className="font-mono-data text-[8px] text-on-surface-variant uppercase mb-1">{t('statsMaxCombo')}</span>
                  <span className="font-headline-md text-primary-container font-bold leading-none">x{stats.maxCombo}</span>
                </div>
                {/* Accuracy */}
                <div className="bg-surface-dim/50 border border-outline-variant/50 rounded p-2 text-center flex flex-col justify-center h-16 cyber-border hover:bg-surface-variant/20 transition-colors">
                  <span className="font-mono-data text-[8px] text-on-surface-variant uppercase mb-1">{t('statsAccuracy')}</span>
                  <span className="font-headline-md text-error font-bold drop-shadow-[0_0_8px_rgba(255,0,85,0.5)] leading-none">{Math.round(stats.averageAccuracy)}%</span>
                </div>
              </div>

              {/* Total Words */}
              <div className="bg-surface-dim/50 border border-outline-variant/50 rounded p-2 text-center mb-3 cyber-border flex-shrink-0">
                <span className="font-mono-data text-[8px] text-on-surface-variant uppercase block mb-1">{t('statsTotalWords')}</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-headline-md text-primary font-bold leading-none">{stats.totalWords}</span>
                  <span className="font-mono-data text-[10px] text-on-surface-variant">{t('wordsCount')}</span>
                </div>
              </div>

              {/* Tooltip / Info Box */}
              <div className="border border-outline-variant/50 bg-surface-variant/20 rounded p-2 flex gap-2 items-start mt-auto flex-shrink-0">
                <span className="material-symbols-outlined text-primary-container text-[14px] mt-0.5">help</span>
                <p className="font-body-md text-[10px] text-on-surface-variant/80 leading-snug">
                  <span className="text-primary-container font-mono-data">Tip:</span> {t('tipDesc')}
                </p>
              </div>
            </div>

            {/* Panel 3: Avionics Config (Audio & Speed Sliders) */}
            <SettingsPanel
              uiLanguage={gameSettings.uiLanguage}
              soundSettings={soundSettings}
              gameSettings={gameSettings}
              onSetGameSettings={onSetGameSettings}
              onToggleSfx={onToggleSfx}
              onToggleMusic={onToggleMusic}
              onSetSfxVolume={onSetSfxVolume}
              onSetMusicVolume={onSetMusicVolume}
              onInitAudio={onInitAudio}
              onTogglePronounce={onTogglePronounce}
              onSetPronunciationAccent={onSetPronunciationAccent}
            />
          </div>

        </div>
      </main>

      <footer className="bg-surface-container-lowest border-t border-outline-variant w-full px-margin-desktop py-2 flex flex-col md:flex-row justify-between items-center gap-2 z-40 flex-shrink-0 text-center md:text-left text-[9px] text-on-surface-variant font-mono-data select-none">
        <div>
          <p className="uppercase">© 2026 Typing Air Battle Command. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Blurred Overlay Modal for CustomWordListManager */}
      {showListManagerModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex justify-center items-center p-6 animate-fade-in font-mono overflow-hidden select-text">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface-container-low border-2 border-primary-container/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,242,255,0.2)] custom-scrollbar">
            
            {/* Modal Close button */}
            <button 
              type="button"
              onClick={() => setShowListManagerModal(false)}
              className="absolute top-4 right-4 text-outline hover:text-primary-container border border-outline-variant hover:border-primary-container p-1 rounded-lg transition-colors cursor-pointer z-50 bg-surface-dim/80 backdrop-blur"
            >
              <span className="material-symbols-outlined text-[20px] font-bold">close</span>
            </button>
            
             <div className="mt-4">
               <CustomWordListManager
                 uiLanguage={gameSettings.uiLanguage}
                 customWordLists={customWordLists}
                 onAddList={onAddCustomList}
                 onDeleteList={onDeleteCustomList}
                 onAddWord={onAddWordToCustomList}
                 onImportWords={onImportWordsToCustomList}
                 onEditWord={onEditWord}
                 onDeleteWord={onDeleteWord}
                 onClearList={onClearList}
                 onExportUserData={onExportUserData}
                 onImportUserData={onImportUserData}
                 activeListId={customListActiveManagerId}
                 onSetActiveListId={setCustomListActiveManagerId}
               />
             </div>
 
           </div>
         </div>
       )}

      {/* Smart Learning System (SLS) Dictionary Explorer Modal */}
      {showSlsDictionaryModal && (
        <SlsDictionaryExplorer
          uiLanguage={gameSettings.uiLanguage}
          statsMap={statsMap}
          onToggleStar={handleToggleStar}
          onToggleSkip={handleToggleSkip}
          onClose={() => setShowSlsDictionaryModal(false)}
          starredCount={slsStats.starredCount}
          skippedCount={slsStats.skippedCount}
          masteredCount={slsStats.masteredCount}
        />
      )}
 
       {/* Practice Home Row Interactive Cockpit Mode */}
       {isHomeRowPracticing && (
         <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[120] flex flex-col justify-between items-center p-6 animate-fade-in select-none">
           {/* Header */}
           <div className="w-full max-w-4xl flex justify-between items-center border-b border-cyber-accent/30 pb-3 mt-4">
             <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
               <div>
                 <h2 className="font-headline-md text-headline-md text-primary font-bold uppercase tracking-wider drop-shadow-[0_0_8px_rgba(0,242,255,0.6)] neon-text-primary">
                   {t('practiceHomeRow')}
                 </h2>
                 <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t('practiceHomeRowDesc')}</p>
               </div>
             </div>
             <button
               onClick={() => { onInitAudio(); setIsHomeRowPracticing(false); }}
               className="text-outline hover:text-cyber-magenta border border-outline-variant hover:border-cyber-magenta/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-mono text-[10px] uppercase font-bold"
             >
               {t('cancel')}
             </button>
           </div>
 
           {/* Interactive display */}
           <div className="flex-grow flex flex-col justify-center items-center gap-6 max-w-4xl w-full">
             {practiceCompleted ? (
               <div className="text-center glass-panel p-8 rounded-2xl border-2 border-cyber-green/40 shadow-[0_0_30px_rgba(34,197,94,0.2)] animate-pulse max-w-lg">
                 <span className="material-symbols-outlined text-cyber-green text-[64px] mb-4">check_circle</span>
                 <h3 className="font-headline-sm text-headline-sm text-cyber-green font-bold uppercase tracking-wider mb-2">
                   {t('practiceCompleted')}
                 </h3>
                 <div className="flex gap-4 mt-6 justify-center">
                   <button
                     onClick={() => {
                       onInitAudio();
                       setIsHomeRowPracticing(false);
                       handlePlayClick(); // Starts game directly!
                     }}
                     className="px-6 py-2.5 bg-cyber-green text-background hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold uppercase rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] cursor-pointer"
                   >
                     {t('playButton')}
                   </button>
                   <button
                     onClick={() => {
                       onInitAudio();
                       setPracticeKeyIndex(0);
                       setPracticeCompleted(false);
                     }}
                     className="px-5 py-2.5 bg-cyber-dark hover:bg-cyber-accent/15 border border-cyber-accent/30 text-cyber-accent rounded-xl hover:text-white transition-all text-xs font-bold uppercase cursor-pointer"
                   >
                     Gõ lại
                   </button>
                 </div>
               </div>
             ) : (
               <div className="w-full flex flex-col items-center gap-6">
                 {/* Progress bar */}
                 <div className="w-full max-w-lg">
                   <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                     <span className="text-gray-400">
                       {t('practiceProgress')
                         ?.replace('{progress}', practiceKeyIndex.toString())
                         ?.replace('{total}', PRACTICE_KEYS.length.toString())}
                     </span>
                     <span className="text-cyber-accent uppercase font-bold tracking-wider">
                       {t('pressKeyPrompt')}{' '}
                       <span className="text-white text-xs bg-cyber-accent/20 px-2 py-0.5 border border-cyber-accent rounded font-bold animate-pulse">
                         {PRACTICE_KEYS[practiceKeyIndex] === ' ' ? 'SPACE' : PRACTICE_KEYS[practiceKeyIndex].toUpperCase()}
                       </span>
                     </span>
                   </div>
                   <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden border border-outline-variant/30">
                     <div 
                       className="h-full bg-gradient-to-r from-primary to-cyber-accent transition-all duration-300 shadow-[0_0_8px_#00f2ff]"
                       style={{ width: `${(practiceKeyIndex / PRACTICE_KEYS.length) * 100}%` }}
                     ></div>
                   </div>
                 </div>
 
                 {/* Hand Placement Instructions */}
                 <div className="glass-panel p-4 rounded-xl border border-cyber-accent/20 flex gap-4 items-center max-w-2xl text-left bg-cyber-dark/30">
                   <span className="material-symbols-outlined text-primary text-[28px]">info</span>
                   <div className="font-mono text-[11px] leading-relaxed text-gray-300">
                     <span className="text-primary font-bold">{t('homeRowHint')}</span>
                   </div>
                 </div>
 
                 {/* Cyberpunk Hands Guide SVG Overlay */}
                 <div className="w-full glass-panel border border-cyber-accent/15 rounded-2xl p-6 bg-cyber-dark/10 shadow-[0_0_20px_rgba(0,242,255,0.05)]">
                   <KeyboardHandsOverlay
                     currentKey={PRACTICE_KEYS[practiceKeyIndex]}
                     currentFinger={KEY_TO_FINGER[PRACTICE_KEYS[practiceKeyIndex]]}
                     showHomeRowHint={true}
                     animationEnabled={true}
                   />
                 </div>
               </div>
             )}
           </div>
 
           {/* Footer */}
           <div className="text-[9px] text-gray-500 font-mono text-center mb-4 uppercase tracking-widest">
             Home Row Preparation Core Suite v1.0.0
           </div>
         </div>
        )}

      {/* Interactive User Guide (Hướng Dẫn Sử Dụng) Glassmorphism Modal */}
      {showUserGuideModal && (
        <div className="fixed inset-0 bg-[#070314]/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="glass-panel w-full max-w-4xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-cyber-accent/40 shadow-[0_0_30px_rgba(0,242,255,0.2)] bg-cyber-dark/95">
            {/* Header */}
            <div className="p-4 border-b border-outline-variant/40 flex justify-between items-center bg-cyber-dark/80">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[24px]">menu_book</span>
                <h2 className="font-headline-md text-headline-md text-primary font-bold uppercase tracking-wider drop-shadow-[0_0_8px_rgba(0,242,255,0.6)] neon-text-primary">
                  {gameSettings.uiLanguage === 'vi' ? 'HƯỚNG DẪN SỬ DỤNG' : gameSettings.uiLanguage === 'ja' ? '使い方ガイド' : 'USER GUIDE'}
                </h2>
              </div>
              <button 
                onClick={() => setShowUserGuideModal(false)}
                className="text-on-surface-variant hover:text-primary hover:bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar text-on-surface-variant bg-cyber-dark/40 font-body-md leading-relaxed text-xs space-y-5">
              {gameSettings.uiLanguage === 'vi' ? (
                // 🇻🇳 VIETNAMESE GUIDE
                <>
                  <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl p-3 flex gap-3 items-center">
                    <span className="material-symbols-outlined text-cyber-accent text-2xl animate-pulse">warning</span>
                    <div className="text-[11px] text-gray-300">
                      <span className="text-cyber-accent font-bold uppercase font-mono-data">QUAN TRỌNG: </span> 
                      Hãy <strong>TẮT BỘ GÕ TIẾNG VIỆT (Telex / Unikey / EVKey)</strong> trên máy tính của bạn (chuyển sang gõ Tiếng Anh - chữ <strong>E</strong>) để tránh các lỗi dính phím hoặc gõ sai ký tự!
                    </div>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">sports_esports</span> 1. Quy tắc gõ phím & Khóa mục tiêu (Lock Target)
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>Quan sát các từ vựng tiếng Anh (kèm nghĩa dịch) đang bay từ trên xuống.</li>
                      <li><strong>Khóa mục tiêu 🎯:</strong> Gõ ký tự <strong>ĐẦU TIÊN</strong> của một từ bất kỳ đang rơi trên màn hình. Phi thuyền của bạn sẽ lập tức khóa tâm ngắm đỏ vào từ đó.</li>
                      <li><strong>Nã đạn liên tiếp:</strong> Khi đã khóa mục tiêu, bạn <strong>phải gõ hoàn thành toàn bộ từ đó</strong> để tiêu diệt nó. Phi thuyền sẽ không nhận ký tự của từ khác cho tới khi mục tiêu hiện tại bị bắn hạ!</li>
                      <li><strong>Bảo vệ căn cứ:</strong> Hãy bắn hạ các từ trước khi chúng chạm vào <strong>vạch đỏ cảnh báo</strong> dưới cùng. Mỗi từ lọt lưới sẽ làm giảm Khiên Chắn (Shield) của bạn. Khiên về 0% = Game Over!</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">school</span> 2. Huấn luyện gõ 10 ngón chuyên nghiệp (Typing Coach)
                    </h3>
                    <p className="mb-2 text-gray-300">Hệ thống hỗ trợ gõ 10 ngón thông minh giúp bạn gõ phím không cần nhìn bàn phím:</p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li><strong>Đôi bàn tay ảo SVG 👋:</strong> Nhấp nháy chính xác ngón tay bạn cần dùng để gõ ký tự tiếp theo.</li>
                      <li><strong>Bàn phím ảo:</strong> Hướng dẫn vị trí đặt ngón tay home row tiêu chuẩn (tay trái: <code>A S D F</code>, tay phải: <code>J K L ;</code>, ngón cái: <code>Space</code>).</li>
                      <li><strong>Tập gõ Home Row nhanh:</strong> Nhấp vào nút <strong>"Tập gõ Home Row"</strong> tại cột giữa menu chính để rèn luyện cơ tay trước khi tham chiến.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">settings</span> 3. Cài đặt tối ưu cho Trẻ em & Người mới bắt đầu
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li><strong>Chế độ Học tập (Learning Mode):</strong> Giảm 30% tốc độ rơi của từ (mặc định còn <code>0.7x</code>), mục tiêu phát sáng rõ nét và giảm 50% sát thương lọt lưới.</li>
                      <li><strong>Tốc độ siêu chậm (0.3x Preset) 👶:</strong> Kéo thanh trượt tốc độ bay về mức <code>0.3x</code> hoặc <code>0.2x</code> để trẻ nhỏ tiểu học hoặc người mới bắt đầu tha hồ thời gian tìm phím.</li>
                      <li><strong>Phát âm từ vựng 🔊:</strong> Bật "Phát âm từ khi bị tiêu diệt" tại cột bên phải để kết hợp học gõ và luyện nghe giọng chuẩn Anh (UK) hoặc Mỹ (US).</li>
                      <li><strong>Nhân vật chiến cơ dễ thương 🐢:</strong> Ngoài Chiến cơ Cyber, Xe tăng thép 👦, Bướm Neon 👧, bạn có thể chọn <strong>Rùa hồng đáng yêu 🐢</strong> với mai rùa trái tim và tia bắn ma thuật hồng nhạt tuyệt đẹp.</li>
                      <li><strong>Đổi giao diện (Theme):</strong> Đổi giữa <em>Cyberpunk (Bé trai 👦)</em> màu xanh neon cá tính và <em>Magical (Bé gái 👧)</em> màu hồng tím ngọt ngào.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">menu_book</span> 4. Luyện tập thông minh & Từ vựng riêng
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li><strong>Luyện từ gắn sao (SLS) ⭐️:</strong> Ấn ngôi sao <code>⭐</code> bên cạnh từ khó trong từ điển hoặc nhật ký chiến trường để đưa vào hàng đợi ôn tập. Hệ thống Spaced Repetition sẽ lặp lại từ này thông minh.</li>
                      <li><strong>Tự tạo danh sách từ riêng 📚:</strong> Dùng bảng <strong>"Quản lý & File Import"</strong> để tự nhập từ thủ công hoặc kéo thả file Excel / CSV bài học trên lớp để học bài cực vui!</li>
                    </ul>
                  </div>
                </>
              ) : gameSettings.uiLanguage === 'ja' ? (
                // 🇯🇵 JAPANESE GUIDE
                <>
                  <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl p-3 flex gap-3 items-center">
                    <span className="material-symbols-outlined text-cyber-accent text-2xl animate-pulse">warning</span>
                    <div className="text-[11px] text-gray-300">
                      <span className="text-cyber-accent font-bold uppercase font-mono-data">重要: </span> 
                      ゲームを始める前に、必ずPCの日本語入力入力を<strong>半角英数（English）</strong>に変更してください！ローマ字入力モードのままだと、正常にキー入力が反映されません。
                    </div>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">sports_esports</span> 1. タイピングとターゲットロックの規則
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>上空から降下してくる英単語（および訳語）をよく確認します。</li>
                      <li><strong>ターゲットロックオン 🎯:</strong> 画面内のいずれかの単語の<strong>最初の文字</strong>をタイピングすると、赤い照準マークでロックオンされます。</li>
                      <li><strong>連射撃破:</strong> ロックオン中は、その単語を<strong>最後までタイピングし終える</strong>必要があります。現在のターゲットを撃墜するまで、他の単語を入力することはできません。</li>
                      <li><strong>防衛ライン:</strong> 下部の<strong>赤点線（警告ライン）</strong>を越える前に単語を撃破してください。侵入を許すとシールドが減少します。シールドが0%になるとゲームオーバーです。</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">school</span> 2. タッチタイピング・コーチ（Typing Coach）
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li><strong>バーチャルSVG両手 👋:</strong> 次に入力するキーをどの指で打つべきかを点滅してリアルタイムで指導します。</li>
                      <li><strong>仮想キーボード:</strong> ホームポジション（左手: <code>A S D F</code>、右手: <code>J K L ;</code>、親指: <code>Space</code>）を分かりやすくガイド。</li>
                      <li><strong>ホーム行練習モード:</strong> メインメニュー中央にある<strong>「ホーム行の練習」</strong>ボタンで、出撃前の指のウォーミングアップが可能です。</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">settings</span> 3. 子供・初心者向けの最適化設定
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li><strong>練習モード（Learning Mode）:</strong> 単語の降下速度が30%低下（デフォルト <code>0.7x</code>）し、ターゲットが明るく光り、シールドへのダメージが半減します。</li>
                      <li><strong>超低速（0.3x 設定） 👶:</strong> 速度スライダーを一番左の <code>0.3x</code> または <code>0.2x</code> にセットすると、小学生や完全な初心者でもキーを探すのに十分な時間が生まれます。</li>
                      <li><strong>音声発音 🔊:</strong> 右メニューの「撃破時に単語を発音する」を有効にすると、アメリカ英語（US）またはイギリス英語（UK）の発音を耳で学びながら遊べます。</li>
                      <li><strong>愛らしいシューター 🐢:</strong> サイバー戦闘機、戦車、蝶のほか、ハートのマイとピンクの魔法レーザーを放つ<strong>可愛いウミガメ（Cute Pink Turtle）🐢</strong>が選択可能です。</li>
                      <li><strong>テーマ切り替え 🎨:</strong> 男の子向けの <em>Cyberpunk (👦)</em> と、ピンクと紫がベースの女の子向け <em>Magical (👧)</em> の2つのテーマを自由に切り替えられます。</li>
                    </ul>
                  </div>
                </>
              ) : (
                // 🇺🇸 ENGLISH GUIDE
                <>
                  <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl p-3 flex gap-3 items-center">
                    <span className="material-symbols-outlined text-cyber-accent text-2xl animate-pulse">warning</span>
                    <div className="text-[11px] text-gray-300">
                      <span className="text-cyber-accent font-bold uppercase font-mono-data">IMPORTANT: </span> 
                      Ensure your system keyboard input method is set to **English** (turn off Telex/IME/Unikey) to avoid typing conflicts or double character insertions!
                    </div>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">sports_esports</span> 1. Core Mechanics & Target Locking
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>Observe the incoming vocabulary fighter jets flying from top to bottom.</li>
                      <li><strong>Lock Target 🎯:</strong> Press the **FIRST letter** of any falling word. Your crosshair will lock onto that word.</li>
                      <li><strong>Laser Fire:</strong> Once locked, you **must type the entire word to destroy it**. Your keyboard will ignore keys for other words until the active target is defeated!</li>
                      <li><strong>Base Defense:</strong> Vaporize words before they reach the **red warning line** at the bottom. Leaked words damage your Shield. Shield at 0% = Game Over!</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">school</span> 2. Interactive Typing Coach
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>**SVG Hand Overlays 👋**: Flashes exactly which finger to use for the next character, helping you learn touch typing without looking down.</li>
                      <li>**Virtual Keyboard**: Visual guide on standard home row placement (left hand: `A S D F`, right hand: `J K L ;`, thumbs on `Space`).</li>
                      <li>**Home Row Warm-up**: Click **"Practice Home Row"** on the main menu to build key muscle memory before deploying into battle.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">settings</span> 3. Kids & Beginner-Friendly Presets
                    </h3>
                    <ul className="list-disc pl-5 space-y-1 text-gray-300">
                      <li>**Learning Mode**: Reduces word speeds by 30% (`0.7x`), adds target glow assistance, and cuts leaked word damage by 50%.</li>
                      <li>**Super Slow Speed (`0.3x` / `0.2x`) 👶**: Drag the speed slider to its lowest settings. Highly recommended for elementary children or keyboard beginners.</li>
                      <li>**TTS Pronunciation 🔊**: Enable "Pronounce on Destroy" on the right console to hear spoken words in US or UK accent as you play.</li>
                      <li>**Magical & Cute Skins 🐢**: Choose the adorable new **Cute Pink Turtle 🐢** with heart shells and magical pink lasers, alongside the cool Cyber Fighter, Steel Tank 👦, and Neon Butterfly 👧.</li>
                      <li>**Dual Theme Support 🎨**: Switch between the neon-styled *Cyberpunk Theme (Boys 👦)* and the cozy, warm *Magical Theme (Girls 👧)*.</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-cyber-dark/90 flex-shrink-0 text-[10px] font-mono text-gray-500">
              <span>SUITE VERSION 1.1.0 (VERIFIED)</span>
              <button 
                onClick={() => setShowUserGuideModal(false)}
                className="px-4 py-1.5 bg-gradient-to-r from-primary-container to-cyber-accent text-background font-bold uppercase rounded hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                {gameSettings.uiLanguage === 'vi' ? 'Đóng hướng dẫn' : gameSettings.uiLanguage === 'ja' ? '閉じる' : 'Close Guide'}
              </button>
            </div>
          </div>
        </div>
      )}

     </div>
   );
 };
