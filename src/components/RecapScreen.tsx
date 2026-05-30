import React from 'react';
import type { GameStats, Language, Level, ReviewItem, GameSettings, WordLearningStats } from '../types/game';
import { useTranslation } from '../i18n/useTranslation';
import { RotateCcw, Home, Sparkles, BookOpen, AlertTriangle, CheckCircle2, Award, Zap, Brain, Star, Eye, EyeOff } from 'lucide-react';

interface RecapScreenProps {
  stats: GameStats;
  wordLogs: ReviewItem[];
  level: Level;
  lang: Language;
  onReplay: () => void;
  onReviewMissed: (missedWords: ReviewItem[]) => void;
  onBackToMenu: () => void;
  gameSettings: GameSettings;
}

export const RecapScreen: React.FC<RecapScreenProps> = ({
  stats,
  wordLogs,
  level,
  lang,
  onReplay,
  onReviewMissed,
  onBackToMenu,
  gameSettings,
}) => {
  const t = useTranslation(gameSettings.uiLanguage);

  // Determine Grade Rank
  const getRank = (accuracy: number, wpm: number) => {
    if (accuracy >= 97 && wpm >= 50) return { letter: 'S', color: 'text-cyber-accent filter drop-shadow-[0_0_8px_rgba(0,243,255,0.7)]', desc: t('gradePerfect') };
    if (accuracy >= 90 && wpm >= 35) return { letter: 'A', color: 'text-cyber-green filter drop-shadow-[0_0_8px_rgba(0,255,102,0.7)]', desc: t('gradeElite') };
    if (accuracy >= 80 && wpm >= 20) return { letter: 'B', color: 'text-cyber-orange filter drop-shadow-[0_0_8px_rgba(255,119,0,0.7)]', desc: t('gradeExpert') };
    if (accuracy >= 70) return { letter: 'C', color: 'text-yellow-400 filter drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]', desc: t('gradeTrained') };
    return { letter: 'D', color: 'text-cyber-magenta filter drop-shadow-[0_0_8px_rgba(255,0,85,0.7)]', desc: t('gradeTryAgain') };
  };

  const rank = getRank(stats.accuracy, stats.wpm);
  
  // Filter out missed words
  const missedWords = wordLogs.filter(w => !w.success || w.errors > 0);
  const successWordsCount = wordLogs.filter(w => w.success).length;

  // Load and parse Word learning stats from localStorage safely with state
  const [statsMap, setStatsMap] = React.useState<{ [word: string]: WordLearningStats }>(() => {
    const wordStatsSaved = localStorage.getItem('typing_combat_word_stats');
    if (wordStatsSaved) {
      try {
        return JSON.parse(wordStatsSaved) || {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const handleToggleStar = (word: string) => {
    const wKey = word.toLowerCase();
    const updated = { ...statsMap };
    const current = updated[wKey] || {
      word,
      attempts: 0,
      correctHits: 0,
      mistakes: 0,
      averageResponseMs: 0,
      // eslint-disable-next-line react-hooks/purity
      lastSeenAt: Date.now()
    };
    current.isStarred = !current.isStarred;
    updated[wKey] = current;
    setStatsMap(updated);
    localStorage.setItem('typing_combat_word_stats', JSON.stringify(updated));
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
  };

  // Map session words to their rolling stats
  const sessionWordStats = wordLogs
    .map(log => {
      const stats = statsMap[log.word.toLowerCase()];
      return stats || null;
    })
    .filter((s): s is WordLearningStats => s !== null);

  // 1. Most Missed Words (highest mistake count)
  const mostMissed = [...sessionWordStats]
    .filter(s => s.mistakes > 0)
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, 1)[0] || null;

  // 2. Hardest Words (lowest accuracy)
  const hardest = [...sessionWordStats]
    .filter(s => s.attempts > 0)
    .map(s => ({
      ...s,
      accuracy: (s.correctHits / (s.correctHits + s.mistakes)) * 100
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 1)[0] || null;

  // 3. Fastest Spelled Words (lowest average response time)
  const fastest = [...sessionWordStats]
    .filter(s => s.averageResponseMs > 0)
    .sort((a, b) => a.averageResponseMs - b.averageResponseMs)
    .slice(0, 1)[0] || null;

  const meaningLabel = gameSettings.uiLanguage === 'vi' ? 'Nghĩa' : gameSettings.uiLanguage === 'ja' ? '意味' : 'Meaning';

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-center items-center px-4 py-8 z-10 overflow-y-auto">
      
      {/* mission title status */}
      <div className="text-center mb-6 select-none font-mono">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 bg-cyber-magenta/10 border border-cyber-magenta/30 rounded-full text-xs text-cyber-magenta uppercase tracking-widest neon-text-magenta">
          Mission report complete
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold font-display uppercase tracking-tight text-white select-none">
          {t('recapTitle')}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {t('recapSubtitle')} <span className="text-cyber-accent">{level}</span> ({lang === 'vi' ? t('vietnamese') : t('japanese')})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-4xl items-stretch">
        
        {/* LEFT COLUMN: Large Grade Shield & Core Metrics */}
        <div className="md:col-span-5 flex flex-col gap-6">
          
          {/* Grade Card */}
          <div className="glass-panel rounded-3xl p-6 text-center flex flex-col items-center justify-center relative overflow-hidden flex-grow min-h-[220px]">
            <div className="absolute inset-0 bg-gradient-to-b from-cyber-accent/5 to-transparent pointer-events-none" />
            
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">{t('evaluation')}</span>
            
            <div className={`text-8xl md:text-9xl font-black font-display tracking-tighter mb-2 ${rank.color}`}>
              {rank.letter}
            </div>
            
            <span className="text-sm font-bold text-white tracking-wide">{rank.desc}</span>
            <span className="text-[10px] text-gray-400 font-mono mt-1">Based on typing speed and accuracy</span>
          </div>

          {/* Core Metrics Grids */}
          <div className="glass-panel rounded-3xl p-5 font-mono text-xs flex flex-col gap-4">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-cyber-accent border-b border-cyber-accent/15 pb-2 mb-2 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5" /> {t('statsCombat')}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-cyber-dark/40 border border-cyber-accent/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-gray-400">{t('statsTotalScore')}</span>
                <div className="text-2xl font-extrabold text-cyber-orange mt-0.5">{stats.score}</div>
              </div>
              <div className="bg-cyber-dark/40 border border-cyber-accent/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-gray-400">{t('statsWpmSpeed')}</span>
                <div className="text-2xl font-extrabold text-cyber-accent mt-0.5">{stats.wpm}</div>
              </div>
              <div className="bg-cyber-dark/40 border border-cyber-accent/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-gray-400">{t('statsAccuracyRecap')}</span>
                <div className="text-2xl font-extrabold text-cyber-magenta mt-0.5">{stats.accuracy}%</div>
              </div>
              <div className="bg-cyber-dark/40 border border-cyber-accent/10 rounded-2xl p-3 text-center">
                <span className="text-[10px] text-gray-400">{t('statsMaxComboRecap')}</span>
                <div className="text-2xl font-extrabold text-cyber-green mt-0.5">x{stats.maxCombo}</div>
              </div>
            </div>

            <div className="bg-cyber-dark/40 border border-cyber-accent/10 rounded-2xl p-3 flex justify-between items-center px-4">
              <span className="text-gray-400">{t('defeatedWords')}:</span>
              <span className="text-sm font-bold text-white">{successWordsCount} / {wordLogs.length} <span className="text-[10px] font-normal text-gray-400">{t('wordsCount')}</span></span>
            </div>
          </div>

          {/* Review Insights Panel */}
          {sessionWordStats.length > 0 && (
            <div className="glass-panel rounded-3xl p-5 font-mono text-xs flex flex-col gap-3">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-cyber-green border-b border-cyber-green/15 pb-2 flex items-center gap-2">
                <Brain className="w-4.5 h-4.5 text-cyber-green" /> {t('wordLearningStats')}
              </h3>
              
              <div className="flex flex-col gap-2.5">
                {/* Most Missed Word */}
                {mostMissed && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-red-950/10 border border-red-500/20">
                    <span className="text-gray-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-cyber-magenta" /> {t('mostMissedWords')}:</span>
                    <span className="font-extrabold text-white uppercase text-xs">{mostMissed.word} <span className="text-[10px] text-cyber-magenta font-normal">({mostMissed.mistakes} {gameSettings.uiLanguage === 'vi' ? 'lỗi' : gameSettings.uiLanguage === 'ja' ? 'ミス' : 'errors'})</span></span>
                  </div>
                )}

                {/* Hardest Word */}
                {hardest && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-cyber-orange/5 border border-cyber-orange/20">
                    <span className="text-gray-400 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-cyber-orange" /> {t('hardestWords')}:</span>
                    <span className="font-extrabold text-white uppercase text-xs">{hardest.word} <span className="text-[10px] text-cyber-orange font-normal">({Math.round((hardest as WordLearningStats & { accuracy: number }).accuracy)}% acc)</span></span>
                  </div>
                )}

                {/* Fastest Spelled Word */}
                {fastest && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-cyber-accent/5 border border-cyber-accent/20">
                    <span className="text-gray-400 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-cyber-accent" /> {t('fastestWords')}:</span>
                    <span className="font-extrabold text-white uppercase text-xs">{fastest.word} <span className="text-[10px] text-cyber-accent font-normal">({Math.round(fastest.averageResponseMs)} ms)</span></span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Word Breakdown & Actions */}
        <div className="md:col-span-7 flex flex-col gap-6">
          
          {/* Detailed Word List logs */}
          <div className="glass-panel rounded-3xl p-5 flex flex-col flex-grow min-h-[280px]">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-cyber-accent border-b border-cyber-accent/15 pb-2 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> {t('logTitle')}
            </h3>
            
            {/* Scrollable list box */}
            <div className="flex-grow overflow-y-auto max-h-[220px] pr-2 custom-scrollbar flex flex-col gap-2 font-mono text-xs">
              {wordLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500 italic">
                  {t('noWordsLogged')}
                </div>
              ) : (
                wordLogs.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      item.success && item.errors === 0
                        ? 'border-green-500/20 bg-green-950/5 hover:bg-green-950/10'
                        : 'border-red-500/25 bg-red-950/5 hover:bg-red-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base select-none">{item.emoji || '✈️'}</span>
                      <div>
                        <div className="font-extrabold text-sm uppercase text-white tracking-wide">{item.word}</div>
                        <div className="text-[10px] text-gray-400 font-sans mt-0.5">{meaningLabel}: {item.meaning}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Star & Skip Controls */}
                      <div className="flex items-center gap-1 border-r border-cyber-accent/15 pr-3 mr-0.5">
                        <button
                          onClick={() => handleToggleStar(item.word)}
                          className={`p-1.5 rounded-lg hover:bg-cyber-accent/10 transition-all transform active:scale-90 cursor-pointer ${
                            statsMap[item.word.toLowerCase()]?.isStarred
                              ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]'
                              : 'text-gray-500 hover:text-yellow-400'
                          }`}
                          title={gameSettings.uiLanguage === 'vi' ? 'Luyện tập từ khó này' : 'Star this word for focus review'}
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleSkip(item.word)}
                          className={`p-1.5 rounded-lg hover:bg-cyber-accent/10 transition-all transform active:scale-90 cursor-pointer ${
                            statsMap[item.word.toLowerCase()]?.isSkipped
                              ? 'text-cyber-magenta opacity-80'
                              : 'text-gray-500 hover:text-cyber-accent'
                          }`}
                          title={gameSettings.uiLanguage === 'vi' ? 'Bỏ qua từ này (đã biết)' : 'Skip this word (already known)'}
                        >
                          {statsMap[item.word.toLowerCase()]?.isSkipped ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="text-right flex flex-col gap-1 items-end">
                        {item.success && item.errors === 0 ? (
                          <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-cyber-green rounded-full border border-green-500/30 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-3 h-3" /> {t('perfectLabel')}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-cyber-magenta rounded-full border border-red-500/30 flex items-center gap-1 font-bold">
                            <AlertTriangle className="w-3 h-3 animate-pulse" /> {t('errorCountLabel', { errors: item.errors })}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-500">{t('attemptsLabel', { attempts: item.attempts })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action triggers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Review Missed Button (only if missed words exist) */}
            <button
              onClick={() => onReviewMissed(missedWords)}
              disabled={missedWords.length === 0}
              className={`p-4 rounded-2xl border font-bold uppercase tracking-wider text-sm font-mono flex items-center justify-center gap-2 transition-all ${
                missedWords.length > 0
                  ? 'border-cyber-magenta bg-cyber-magenta/10 hover:bg-cyber-magenta/20 text-cyber-magenta shadow-neon-magenta active:scale-95'
                  : 'border-gray-800 text-gray-500 bg-gray-900/20 cursor-not-allowed'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{t('reviewMissedButton', { count: missedWords.length })}</span>
            </button>

            {/* Play again */}
            <button
              onClick={onReplay}
              className="p-4 rounded-2xl bg-gradient-to-r from-cyber-accent to-cyber-indigo hover:from-cyber-accent/80 hover:to-cyber-indigo/80 text-white font-bold uppercase tracking-wider text-sm font-mono flex items-center justify-center gap-2 shadow-neon-cyan active:scale-95 transition-all border border-cyber-accent/30"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t('playNewGame')}</span>
            </button>
          </div>

          <button
            onClick={onBackToMenu}
            className="py-3.5 bg-gray-850 hover:bg-gray-800 border border-gray-700/50 rounded-2xl font-mono text-sm text-gray-300 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Home className="w-4.5 h-4.5" /> {t('backToMenu')}
          </button>

        </div>

      </div>

    </div>
  );
};
