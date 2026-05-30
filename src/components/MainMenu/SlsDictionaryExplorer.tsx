import React, { useState, useEffect, useMemo } from 'react';
import type { Level, DictionaryEntry } from '../../types/game';
import { fetchAllWords, fetchPhrases } from '../../data/api';

interface SlsDictionaryExplorerProps {
  uiLanguage: string;
  statsMap: Record<string, {
    word: string;
    isStarred?: boolean;
    isSkipped?: boolean;
    masteryScore: number;
    attempts: number;
    correctHits: number;
    mistakes: number;
    averageResponseMs: number;
    lastSeenAt: number;
  }>;
  onToggleStar: (word: string) => void;
  onToggleSkip: (word: string) => void;
  onClose: () => void;
  starredCount: number;
  skippedCount: number;
  masteredCount: number;
}

export const SlsDictionaryExplorer: React.FC<SlsDictionaryExplorerProps> = ({
  uiLanguage,
  statsMap,
  onToggleStar,
  onToggleSkip,
  onClose,
  starredCount,
  skippedCount,
  masteredCount,
}) => {
  const [dictSearch, setDictSearch] = useState('');
  const [dictLevelFilter, setDictLevelFilter] = useState<Level | 'All'>('All');
  const [dictFilterType, setDictFilterType] = useState<'all' | 'starred' | 'skipped' | 'mastered' | 'unmastered'>('all');
  const [dictPage, setDictPage] = useState(0);
  const [combinedEntries, setCombinedEntries] = useState<DictionaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load entries asynchronously
  useEffect(() => {
    Promise.all([
      fetchAllWords(),
      fetchPhrases()
    ]).then(([words, phrases]) => {
      const seen = new Set<string>();
      const merged: DictionaryEntry[] = [];
      
      words.forEach(item => {
        const key = item.word.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      });

      phrases.forEach(item => {
        const key = item.word.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({
            ...item,
            level: item.level || 'Kids'
          });
        }
      });
      
      setCombinedEntries(merged);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const filteredDictEntries = useMemo(() => {
    return combinedEntries.filter(entry => {
      // 1. Level Filter
      if (dictLevelFilter !== 'All' && entry.level !== dictLevelFilter) {
        return false;
      }
      
      // 2. Search Query Filter
      if (dictSearch.trim() !== '') {
        const query = dictSearch.toLowerCase().trim();
        const matchesWord = entry.word.toLowerCase().includes(query);
        const matchesVi = entry.meaning_vi?.toLowerCase().includes(query);
        const matchesJa = entry.meaning_ja?.toLowerCase().includes(query);
        if (!matchesWord && !matchesVi && !matchesJa) {
          return false;
        }
      }
      
      // 3. Category Filter Type
      const wKey = entry.word.toLowerCase();
      const wStats = statsMap[wKey];
      const isStarred = wStats?.isStarred || false;
      const isSkipped = wStats?.isSkipped || false;
      const mastery = wStats?.masteryScore || 0;
      
      if (dictFilterType === 'starred' && !isStarred) return false;
      if (dictFilterType === 'skipped' && !isSkipped) return false;
      if (dictFilterType === 'mastered' && mastery < 3) return false;
      if (dictFilterType === 'unmastered' && mastery >= 3) return false;
      
      return true;
    });
  }, [combinedEntries, dictLevelFilter, dictSearch, dictFilterType, statsMap]);

  // Pagination Logic
  const itemsPerPage = 30;
  const totalPages = Math.max(1, Math.ceil(filteredDictEntries.length / itemsPerPage));
  
  const paginatedEntries = useMemo(() => {
    const start = dictPage * itemsPerPage;
    return filteredDictEntries.slice(start, start + itemsPerPage);
  }, [filteredDictEntries, dictPage]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex justify-center items-center p-6 animate-fade-in font-mono overflow-hidden select-text">
      <div className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-surface-container-low border-2 border-primary-container/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,242,255,0.25)]">
        
        {/* Modal Close button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-outline hover:text-primary-container border border-outline-variant hover:border-primary-container p-1 rounded-lg transition-colors cursor-pointer z-50 bg-surface-dim/80 backdrop-blur animate-pulse"
        >
          <span className="material-symbols-outlined text-[20px] font-bold">close</span>
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 border-b border-outline-variant pb-3 flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-[28px] drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          <div>
            <h2 className="font-headline-md text-headline-md text-primary font-bold uppercase tracking-wider neon-text-primary">
              {uiLanguage === 'vi' ? 'Từ Điển Luyện Tập Thông Minh (SLS)' : uiLanguage === 'ja' ? 'スマート学習システム (SLS) 辞書' : 'Smart Learning System (SLS) Dictionary'}
            </h2>
            <p className="text-[10px] text-gray-400">
              {uiLanguage === 'vi' 
                ? 'Khám phá từ vựng, quản lý danh sách gắn sao (Star) và bỏ qua (Skip) để tối ưu hóa quá trình học.'
                : uiLanguage === 'ja'
                  ? '単語を検索し、優先（Star）や非表示（Skip）を管理して学習プロセスを最適化します。'
                  : 'Explore vocabulary, manage starred and skipped lists to optimize your learning path.'}
            </p>
          </div>
        </div>

        {/* Control Center & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-4 flex-shrink-0 bg-surface-dim/30 p-3 rounded-lg border border-outline-variant/30">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-outline">search</span>
            <input
              type="text"
              placeholder={uiLanguage === 'vi' ? 'Tìm kiếm từ vựng hoặc nghĩa Anh-Việt-Nhật...' : uiLanguage === 'ja' ? '英 và・英越・単語を検索...' : 'Search word or meaning...'}
              value={dictSearch}
              onChange={(e) => { setDictSearch(e.target.value); setDictPage(0); }}
              className="w-full bg-surface-dim border border-outline-variant rounded-lg pl-9 pr-3 py-2 text-xs text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
          </div>

          {/* Level Filter Dropdown */}
          <div>
            <select
              value={dictLevelFilter}
              onChange={(e) => { setDictLevelFilter(e.target.value as Level | 'All'); setDictPage(0); }}
              className="w-full bg-surface-dim border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary focus:border-primary outline-none transition-colors cursor-pointer"
            >
              <option value="All">{uiLanguage === 'vi' ? 'Tất cả Cấp độ' : uiLanguage === 'ja' ? 'すべてのレベル' : 'All Levels'}</option>
              <option value="Alphabet">Alphabet</option>
              <option value="Kids">Kids</option>
              <option value="Eiken 5 Kyu">Eiken 5 Kyu</option>
              <option value="Eiken 4 Kyu">Eiken 4 Kyu</option>
              <option value="Eiken 3 Kyu">Eiken 3 Kyu</option>
              <option value="Eiken Pre 2 Kyu">Eiken Pre 2 Kyu</option>
              <option value="Eiken 2 Kyu">Eiken 2 Kyu</option>
              <option value="Eiken Pre 1 Kyu">Eiken Pre 1 Kyu</option>
              <option value="Eiken 1 Kyu">Eiken 1 Kyu</option>
              <option value="TOEIC">TOEIC</option>
              <option value="IELTS">IELTS</option>
              <option value="TOEFL">TOEFL</option>
            </select>
          </div>

          {/* SLS Filter Type Tabs */}
          <div>
            <select
              value={dictFilterType}
              onChange={(e) => { setDictFilterType(e.target.value as 'all' | 'starred' | 'skipped' | 'mastered' | 'unmastered'); setDictPage(0); }}
              className="w-full bg-surface-dim border border-outline-variant rounded-lg px-3 py-2 text-xs text-primary focus:border-primary outline-none transition-colors cursor-pointer"
            >
              <option value="all">{uiLanguage === 'vi' ? 'Tất cả trạng thái' : uiLanguage === 'ja' ? 'すべてのステータス' : 'All Status'}</option>
              <option value="starred">⭐ {uiLanguage === 'vi' ? 'Đang ôn tập' : uiLanguage === 'ja' ? '要復習' : 'Reviewing'} ({starredCount})</option>
              <option value="skipped">👁️ {uiLanguage === 'vi' ? 'Đã bỏ qua' : uiLanguage === 'ja' ? '非表示' : 'Skipped'} ({skippedCount})</option>
              <option value="mastered">🎓 {uiLanguage === 'vi' ? 'Đã thành thạo' : uiLanguage === 'ja' ? '習得済み' : 'Mastered'} ({masteredCount})</option>
              <option value="unmastered">📝 {uiLanguage === 'vi' ? 'Cần học tập' : uiLanguage === 'ja' ? '未習得' : 'Unmastered'}</option>
            </select>
          </div>
        </div>

        {/* List Results */}
        <div className="flex-grow overflow-y-auto custom-scrollbar border border-outline-variant/30 rounded-xl bg-cyber-dark/10 p-2 mb-4">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-2">sync</span>
              <h4 className="text-sm font-bold text-primary uppercase">{uiLanguage === 'vi' ? 'Đang tải dữ liệu...' : 'Loading entries...'}</h4>
            </div>
          ) : paginatedEntries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">find_in_page</span>
              <h4 className="text-sm font-bold text-on-surface-variant uppercase">{uiLanguage === 'vi' ? 'Không tìm thấy từ vựng' : 'No words found'}</h4>
              <p className="text-xs text-on-surface-variant/70 max-w-md mt-1">
                {uiLanguage === 'vi' ? 'Vui lòng điều chỉnh bộ lọc hoặc từ khóa tìm kiếm của bạn.' : 'Please adjust your search filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {paginatedEntries.map(entry => {
                const wKey = entry.word.toLowerCase();
                const wStats = statsMap[wKey] || {};
                const isStarred = wStats.isStarred || false;
                const isSkipped = wStats.isSkipped || false;
                const mastery = wStats.masteryScore || 0;
                
                return (
                  <div 
                    key={entry.word}
                    className={`flex flex-col justify-between p-3 rounded-lg border transition-all ${
                      isSkipped 
                        ? 'border-outline-variant/20 bg-surface/20 opacity-50' 
                        : 'border-outline-variant/40 bg-surface-container hover:border-primary/60 hover:bg-surface-variant/10'
                    }`}
                  >
                    {/* Word content and language translation */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-white tracking-wide">{entry.word}</span>
                          {entry.emoji && <span className="text-xs">{entry.emoji}</span>}
                          <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary-container rounded text-[8px] font-bold font-mono">
                            {entry.level}
                          </span>
                          {entry.difficulty && (
                            <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded border font-mono ${
                              entry.difficulty === 3 
                                ? 'bg-critical-red/10 border-critical-red/30 text-critical-red' 
                                : entry.difficulty === 2 
                                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' 
                                  : 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green'
                            }`}>
                              Diff: {entry.difficulty}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-300 mt-1 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-primary/80 w-5">VN:</span>
                            <span className="truncate">{entry.meaning_vi || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-pink-400/80 w-5">JP:</span>
                            <span className="truncate">{entry.meaning_ja || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Star & Skip actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleStar(entry.word)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isStarred 
                              ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' 
                              : 'border-outline-variant/40 hover:border-yellow-500 hover:text-yellow-400 text-outline'
                          }`}
                          title={isStarred ? 'Bỏ đánh dấu ôn tập' : 'Đánh dấu ưu tiên ôn tập (Star)'}
                        >
                          <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: isStarred ? "'FILL' 1" : undefined }}>star</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleSkip(entry.word)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSkipped 
                              ? 'border-red-500 bg-red-500/10 text-red-400' 
                              : 'border-outline-variant/40 hover:border-red-500 hover:text-red-400 text-outline'
                          }`}
                          title={isSkipped ? 'Bỏ ẩn từ' : 'Ẩn từ này khỏi phòng chơi (Skip)'}
                        >
                          <span className="material-symbols-outlined text-[16px] leading-none">{isSkipped ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Mastery Score Segmented Dots & Stats details */}
                    <div className="flex items-center justify-between border-t border-outline-variant/20 pt-1.5 mt-auto text-[9px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Mastery:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map(dot => {
                            const active = mastery >= dot;
                            return (
                              <div
                                key={dot}
                                className={`w-2 h-2 rounded-full border transition-all duration-300 ${
                                  active 
                                    ? mastery === 3 
                                      ? 'bg-cyber-green border-cyber-green shadow-[0_0_5px_#00ff66]' 
                                      : 'bg-primary border-primary shadow-[0_0_5px_#00f2ff]'
                                    : 'bg-transparent border-outline-variant/50'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </div>
                      
                      {wStats.attempts > 0 ? (
                        <div className="text-on-surface-variant flex gap-3">
                          <span>WPM: <b className="text-white">{wStats.attempts > 0 ? Math.round(60000 / (wStats.averageResponseMs || 2000)) : 0}</b></span>
                          <span>Correct: <b className="text-cyber-green">{Math.round((wStats.correctHits / (wStats.correctHits + wStats.mistakes || 1)) * 100)}%</b></span>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">{uiLanguage === 'vi' ? 'Chưa luyện tập' : 'Not practiced'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Controls Footer */}
        <div className="flex justify-between items-center border-t border-outline-variant pb-1 pt-3 flex-shrink-0 font-mono text-xs">
          <div className="text-on-surface-variant">
            {uiLanguage === 'vi' ? (
              <>Hiển thị <b className="text-primary">{paginatedEntries.length}</b>/{filteredDictEntries.length} từ vựng</>
            ) : (
              <>Showing <b className="text-primary">{paginatedEntries.length}</b>/{filteredDictEntries.length} words</>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={dictPage === 0}
              onClick={() => setDictPage(prev => Math.max(0, prev - 1))}
              className="px-2.5 py-1 rounded bg-surface border border-outline-variant/50 hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="text-on-surface-variant text-[11px]">
              {uiLanguage === 'vi' ? <>Trang <b className="text-white">{dictPage + 1}</b> / {totalPages}</> : <>Page <b className="text-white">{dictPage + 1}</b> / {totalPages}</>}
            </span>
            <button
              type="button"
              disabled={dictPage >= totalPages - 1}
              onClick={() => setDictPage(prev => Math.min(totalPages - 1, prev + 1))}
              className="px-2.5 py-1 rounded bg-surface border border-outline-variant/50 hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
