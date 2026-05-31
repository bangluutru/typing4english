import React, { useState, useEffect } from 'react';
import type { CustomWordList, DictionaryEntry, UILanguage } from '../types/game';
import { useTranslation } from '../i18n/useTranslation';
import { VocabularyImporter } from './CustomWordListManager/VocabularyImporter';
import { 
  Plus, 
  Trash2, 
  PlusCircle, 
  HelpCircle,
  Search,
  Edit,
  Check,
  X,
  SlidersHorizontal,
  FileOutput,
  FileInput,
  AlertCircle
} from 'lucide-react';

interface CustomWordListManagerProps {
  uiLanguage: UILanguage;
  customWordLists: CustomWordList[];
  onAddList: (name: string, description?: string) => void;
  onDeleteList: (id: string) => void;
  onAddWord: (listId: string, entry: DictionaryEntry) => void;
  onImportWords: (listId: string, entries: DictionaryEntry[]) => void;
  onEditWord?: (listId: string, index: number, updatedEntry: DictionaryEntry) => void;
  onDeleteWord?: (listId: string, index: number) => void;
  onClearList?: (listId: string) => void;
  onExportUserData?: () => void;
  onImportUserData?: (dataStr: string) => boolean;
  activeListId: string | null;
  onSetActiveListId: (id: string | null) => void;
}

export const CustomWordListManager: React.FC<CustomWordListManagerProps> = ({
  uiLanguage,
  customWordLists,
  onAddList,
  onDeleteList,
  onAddWord,
  onImportWords,
  onEditWord,
  onDeleteWord,
  onClearList,
  onExportUserData,
  onImportUserData,
  activeListId,
  onSetActiveListId,
}) => {
  const t = useTranslation(uiLanguage);

  // Form states
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  
  // Word state
  const [word, setWord] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [meaningJa, setMeaningJa] = useState('');
  const [difficulty, setDifficulty] = useState<number>(2);
  const [emoji, setEmoji] = useState('');

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabet-asc' | 'alphabet-desc' | 'diff-asc' | 'diff-desc'>('alphabet-asc');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');

  // Inline editing states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editWord, setEditWord] = useState('');
  const [editMeaningVi, setEditMeaningVi] = useState('');
  const [editMeaningJa, setEditMeaningJa] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<number>(2);
  const [editEmoji, setEditEmoji] = useState('');
  const [inlineError, setInlineError] = useState('');

  // Form validation errors
  const [wordError, setWordError] = useState('');

  // Debouncing search query (150-250ms -> 200ms is perfect)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setEditingIndex(null);
      setSearchQuery('');
      setFilterDifficulty('all');
    }, 0);
    return () => clearTimeout(timer);
  }, [activeListId]);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    onAddList(newListName.trim(), newListDesc.trim());
    setNewListName('');
    setNewListDesc('');
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    setWordError('');

    if (!activeListId) return;
    if (!word.trim()) {
      setWordError(t('wordRequired'));
      return;
    }

    if (!meaningVi.trim() && !meaningJa.trim()) {
      setWordError(t('meaningRequired'));
      return;
    }

    // Fallbacks if one translation is missing
    const vi = meaningVi.trim() || meaningJa.trim();
    const ja = meaningJa.trim() || meaningVi.trim();

    const newEntry: DictionaryEntry = {
      word: word.trim().toLowerCase(),
      meaning_vi: vi,
      meaning_ja: ja,
      level: 'Eiken 5 Kyu', // Match standard type
      difficulty,
      emoji: emoji.trim() || undefined,
    };

    onAddWord(activeListId, newEntry);
    
    // Clear inputs
    setWord('');
    setMeaningVi('');
    setMeaningJa('');
    setDifficulty(2);
    setEmoji('');
  };



  // Export List as downloadable JSON Blob file
  const handleExport = (list: CustomWordList) => {
    try {
      const dataStr = JSON.stringify(list.entries, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${list.name.replace(/\s+/g, '_')}_vocab.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  };

  // Inline editing actions
  const startEditWord = (idx: number, entry: DictionaryEntry) => {
    setEditingIndex(idx);
    setEditWord(entry.word);
    setEditMeaningVi(entry.meaning_vi || '');
    setEditMeaningJa(entry.meaning_ja || '');
    setEditDifficulty(entry.difficulty);
    setEditEmoji(entry.emoji || '');
    setInlineError('');
  };

  const cancelEditWord = () => {
    setEditingIndex(null);
    setInlineError('');
  };

  const saveEditedWord = (originalIndex: number) => {
    setInlineError('');
    if (!activeListId || !onEditWord) return;

    if (!editWord.trim()) {
      setInlineError(t('wordRequired'));
      return;
    }

    if (!editMeaningVi.trim() && !editMeaningJa.trim()) {
      setInlineError(t('meaningRequired'));
      return;
    }

    const updatedEntry: DictionaryEntry = {
      word: editWord.trim().toLowerCase(),
      meaning_vi: editMeaningVi.trim() || editMeaningJa.trim(),
      meaning_ja: editMeaningJa.trim() || editMeaningVi.trim(),
      level: activeList?.entries[originalIndex]?.level || 'Eiken 5 Kyu',
      difficulty: editDifficulty,
      emoji: editEmoji.trim() || undefined,
    };

    onEditWord(activeListId, originalIndex, updatedEntry);
    setEditingIndex(null);
  };

  const handleClearList = () => {
    if (!activeListId || !onClearList) return;
    const confirmClear = window.confirm(t('customWords.confirmClearAll'));
    if (confirmClear) {
      onClearList(activeListId);
    }
  };

  const activeList = customWordLists.find(l => l.id === activeListId);

  // Apply search filtering & sorting
  const getProcessedEntries = (): { entry: DictionaryEntry; originalIndex: number }[] => {
    if (!activeList) return [];

    // Keep track of original indices for correct edit/delete operations
    let indexed = activeList.entries.map((entry, idx) => ({ entry, originalIndex: idx }));

    // 1. Filter by Search Query
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim();
      indexed = indexed.filter(
        item => 
          item.entry.word.toLowerCase().includes(q) ||
          (item.entry.meaning_vi && item.entry.meaning_vi.toLowerCase().includes(q)) ||
          (item.entry.meaning_ja && item.entry.meaning_ja.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Difficulty
    if (filterDifficulty !== 'all') {
      const diffNum = parseInt(filterDifficulty);
      indexed = indexed.filter(item => item.entry.difficulty === diffNum);
    }

    // 3. Sort
    indexed.sort((a, b) => {
      if (sortBy === 'alphabet-asc') {
        return a.entry.word.localeCompare(b.entry.word);
      }
      if (sortBy === 'alphabet-desc') {
        return b.entry.word.localeCompare(a.entry.word);
      }
      if (sortBy === 'diff-asc') {
        return a.entry.difficulty - b.entry.difficulty;
      }
      if (sortBy === 'diff-desc') {
        return b.entry.difficulty - a.entry.difficulty;
      }
      return 0;
    });

    return indexed;
  };

  const processedEntries = getProcessedEntries();

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden flex flex-col font-mono text-xs text-gray-300">
      
      {/* Module Title */}
      <div className="flex items-center justify-between mb-4 border-b border-cyber-accent/15 pb-2">
        <h2 className="text-sm font-display font-bold uppercase tracking-wider text-cyber-accent flex items-center gap-2">
          <PlusCircle className="w-4.5 h-4.5" /> {t('customWordListManager')}
        </h2>
        <span className="text-[10px] text-gray-500">{customWordLists.length} Lists Saved</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT SUB-COLUMN: List selector & List Creator */}
        <div className="md:col-span-4 flex flex-col gap-4">
          
          {/* Create new list form */}
          <form onSubmit={handleCreateList} className="flex flex-col gap-3 bg-cyber-dark/40 border border-cyber-accent/10 rounded-xl p-3">
            <h3 className="text-cyber-accent font-bold uppercase tracking-wide text-[10px]">{t('createNewList')}</h3>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-400">{t('listName')}</label>
              <input 
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="TOEIC Level 2..."
                required
                className="w-full bg-cyber-bg border border-cyber-accent/20 hover:border-cyber-accent/40 focus:border-cyber-accent rounded px-2.5 py-1.5 outline-none text-white transition-all text-xs"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-gray-400">{t('description')}</label>
              <textarea 
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder="My personal targets..."
                rows={2}
                className="w-full bg-cyber-bg border border-cyber-accent/20 hover:border-cyber-accent/40 focus:border-cyber-accent rounded px-2.5 py-1.5 outline-none text-white transition-all text-xs resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-1.5 bg-cyber-accent/15 hover:bg-cyber-accent/35 border border-cyber-accent/30 hover:border-cyber-accent/60 text-cyber-accent hover:text-white rounded font-bold uppercase transition-all tracking-wider text-[10px] flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> {t('createNewListButton')}
            </button>
          </form>

          {/* List selection drawer */}
          <div className="flex flex-col gap-2">
            <label className="text-[9px] text-gray-400 uppercase tracking-widest">{t('customListTitle')}</label>
            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {customWordLists.length === 0 ? (
                <div className="text-[10px] text-gray-500 italic py-4 text-center border border-dashed border-gray-800 rounded-xl">
                  {t('customWordListPlaceholder')}
                </div>
              ) : (
                customWordLists.map(list => {
                  const isActive = activeListId === list.id;
                  return (
                    <div 
                      key={list.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isActive 
                          ? 'border-cyber-accent bg-cyber-accent/10 text-white' 
                          : 'border-cyber-accent/10 hover:border-cyber-accent/30 bg-cyber-dark/20'
                      }`}
                    >
                      <button
                        onClick={() => onSetActiveListId(isActive ? null : list.id)}
                        className="flex-grow text-left flex flex-col min-w-0"
                      >
                        <span className="font-bold text-xs truncate uppercase tracking-wide">{list.name}</span>
                        <span className="text-[9px] text-gray-400 truncate font-mono mt-0.5">
                          {list.entries.length} {t('wordsCount')} {list.description ? `- ${list.description}` : ''}
                        </span>
                      </button>
                      
                      <div className="flex items-center gap-1.5 ml-2">
                        {/* Export */}
                        <button
                          onClick={() => handleExport(list)}
                          className="p-1 hover:bg-cyber-accent/10 border border-transparent hover:border-cyber-accent/30 rounded text-cyber-accent transition-all cursor-pointer"
                          title={t('exportLabel')}
                        >
                          <FileOutput className="w-3 h-3" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (window.confirm(t('deleteConfirm'))) {
                              onDeleteList(list.id);
                            }
                          }}
                          className="p-1 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded text-cyber-magenta transition-all cursor-pointer"
                          title={t('delete')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Global Backup & Restore Box */}
          {onExportUserData && onImportUserData && (
            <div className="flex flex-col gap-2.5 bg-cyber-dark/40 border border-cyber-accent/10 rounded-xl p-3 mt-1">
              <h3 className="text-cyber-accent font-bold uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t('backupRestore')}
              </h3>
              <p className="text-[9px] text-gray-500 leading-normal">
                {t('customWords.backupDescription')}
              </p>
              
              <div className="flex flex-col gap-2">
                {/* Export Data */}
                <button
                  type="button"
                  onClick={onExportUserData}
                  className="w-full py-1 bg-cyber-accent/10 hover:bg-cyber-accent/30 border border-cyber-accent/20 hover:border-cyber-accent/50 text-cyber-accent hover:text-white rounded font-bold uppercase transition-all tracking-wider text-[9px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileOutput className="w-3.5 h-3.5" />
                  {t('exportDataBtn')}
                </button>

                {/* Import Data */}
                <div className="relative w-full">
                  <input
                    type="file"
                    accept=".json"
                    id="global-backup-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const confirmImport = window.confirm(t('confirmRestore'));
                      if (!confirmImport) {
                        e.target.value = '';
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        const success = onImportUserData(content);
                        if (success) {
                          alert(t('importSuccessMsg'));
                        } else {
                          alert(t('importErrorMsg'));
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="global-backup-upload"
                    className="w-full py-1 bg-cyber-magenta/10 hover:bg-cyber-magenta/30 border border-cyber-magenta/20 hover:border-cyber-magenta/50 text-cyber-magenta hover:text-white rounded font-bold uppercase transition-all tracking-wider text-[9px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileInput className="w-3.5 h-3.5" />
                    {t('importDataBtn')}
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT SUB-COLUMN: Words Manager within Active Selected List */}
        <div className="md:col-span-8 flex flex-col gap-4">
          
          {activeList ? (
            <div className="flex flex-col gap-5">
              
              {/* Active List Headers & Clear All */}
              <div className="flex items-center justify-between border-b border-cyber-accent/10 pb-1.5 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{activeList.name}</h3>
                  {activeList.description && <p className="text-[10px] text-gray-400 italic mt-0.5">{activeList.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  {onClearList && activeList.entries.length > 0 && (
                    <button
                      onClick={handleClearList}
                      className="px-2.5 py-1 text-[9px] bg-red-950/20 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/60 text-cyber-magenta hover:text-white rounded font-bold uppercase transition-all tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t('customWords.clearAllBtn').toUpperCase()}
                    </button>
                  )}
                  <span className="px-2 py-0.5 bg-cyber-accent/10 border border-cyber-accent/30 rounded text-[10px] text-cyber-accent font-bold">
                    {activeList.entries.length} {t('wordsCount')}
                  </span>
                </div>
              </div>

              {/* TWO COLUMNS: Manual word addition (Left) & Tabbed Importer (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* 1. Left side Column: Manual Form Addition */}
                <div className="lg:col-span-5">
                  <form onSubmit={handleAddWord} className="flex flex-col gap-2 bg-cyber-dark/20 border border-cyber-accent/5 rounded-xl p-3.5 h-full justify-between">
                    <div>
                      <h4 className="font-bold text-cyber-accent uppercase tracking-wide text-[10px] flex items-center gap-1 mb-2">
                        <Plus className="w-3.5 h-3.5" /> {t('manualWordAddition')}
                      </h4>

                      {wordError && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-950/20 border border-red-500/30 rounded text-[9px] text-cyber-magenta mb-2 animate-pulse">
                          <AlertCircle className="w-3.5 h-3.5" /> {wordError}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 mb-1.5">
                        <label className="text-[9px] text-gray-400">{t('englishWord')} *</label>
                        <input 
                          type="text"
                          value={word}
                          onChange={(e) => setWord(e.target.value)}
                          placeholder="hello, environment..."
                          className="w-full bg-cyber-bg border border-cyber-accent/10 focus:border-cyber-accent rounded px-2 py-1 text-white text-xs outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-1.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-400">{t('meaningVi')}</label>
                          <input 
                            type="text"
                            value={meaningVi}
                            onChange={(e) => setMeaningVi(e.target.value)}
                            placeholder={t('placeholderVi')}
                            className="w-full bg-cyber-bg border border-cyber-accent/10 focus:border-cyber-accent rounded px-2 py-1 text-white text-xs outline-none transition-all font-sans"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-400">{t('meaningJa')}</label>
                          <input 
                            type="text"
                            value={meaningJa}
                            onChange={(e) => setMeaningJa(e.target.value)}
                            placeholder={t('placeholderJa')}
                            className="w-full bg-cyber-bg border border-cyber-accent/10 focus:border-cyber-accent rounded px-2 py-1 text-white text-xs outline-none transition-all font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-400">{t('difficulty')}</label>
                          <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(Number(e.target.value))}
                            className="w-full bg-cyber-bg border border-cyber-accent/10 focus:border-cyber-accent rounded px-2 py-1.5 text-white text-xs outline-none cursor-pointer"
                          >
                            <option value={1}>{t('difficultyEasy')}</option>
                            <option value={2}>{t('difficultyMedium')}</option>
                            <option value={3}>{t('difficultyHard')}</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-400">{t('emoji')}</label>
                          <input 
                            type="text"
                            value={emoji}
                            onChange={(e) => setEmoji(e.target.value)}
                            placeholder="👋, 💻..."
                            maxLength={2}
                            className="w-full bg-cyber-bg border border-cyber-accent/10 focus:border-cyber-accent rounded px-2 py-1 text-center text-white text-xs outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-1.5 bg-cyber-green/10 hover:bg-cyber-green/30 border border-cyber-green/30 hover:border-cyber-green/60 text-cyber-green hover:text-white rounded font-bold uppercase transition-all tracking-wider text-[10px] mt-3 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t('addWordButton')}
                    </button>
                  </form>
                </div>

                {/* 2. Right side Column: Tabbed Importer */}
                <VocabularyImporter
                  key={activeListId || ''}
                  uiLanguage={uiLanguage}
                  activeListId={activeListId || ''}
                  activeListEntries={activeList?.entries || []}
                  onImportWords={onImportWords}
                />
              </div>

              {/* Search, Filter & Advanced Words List with Edit/Delete */}
              <div className="flex flex-col gap-3 bg-cyber-dark/20 border border-cyber-accent/10 rounded-xl p-4">
                
                {/* Search & Sort HUD controls */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-cyber-accent/10 pb-3 flex-shrink-0">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('customWords.placeholderSearch')}
                      className="w-full bg-cyber-bg/70 border border-cyber-accent/20 focus:border-cyber-accent rounded-lg pl-9 pr-3 py-1.5 text-white text-xs outline-none transition-all"
                    />
                  </div>
                  
                  {/* Sorting & Filter Selectors */}
                  <div className="flex gap-2 w-full sm:w-auto items-center">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-cyber-accent shrink-0" />
                    <select
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="bg-cyber-bg border border-cyber-accent/20 rounded px-2 py-1 text-[10px] text-gray-300 outline-none cursor-pointer hover:border-cyber-accent/40"
                    >
                      <option value="all">{t('customWords.filterDifficulty')}</option>
                      <option value="1">{t('difficultyEasy')}</option>
                      <option value="2">{t('difficultyMedium')}</option>
                      <option value="3">{t('difficultyHard')}</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'alphabet-asc' | 'alphabet-desc' | 'diff-asc' | 'diff-desc')}
                      className="bg-cyber-bg border border-cyber-accent/20 rounded px-2 py-1 text-[10px] text-gray-300 outline-none cursor-pointer hover:border-cyber-accent/40"
                    >
                      <option value="alphabet-asc">A - Z</option>
                      <option value="alphabet-desc">Z - A</option>
                      <option value="diff-asc">{t('customWords.sortDifficultyAsc')}</option>
                      <option value="diff-desc">{t('customWords.sortDifficultyDesc')}</option>
                    </select>
                  </div>
                </div>

                {/* Main Words Scroll Container */}
                <div className="max-h-[220px] overflow-y-auto custom-scrollbar pr-1.5 flex flex-col gap-2">
                  {processedEntries.length === 0 ? (
                    <div className="text-[10px] text-gray-500 italic text-center py-8">
                      {searchQuery.trim() 
                        ? t('customWords.noMatchingResults')
                        : t('customWords.selectCategoryDesc')
                      }
                    </div>
                  ) : (
                    processedEntries.map(({ entry, originalIndex }) => {
                      const isEditing = editingIndex === originalIndex;

                      if (isEditing) {
                        return (
                          <div key={originalIndex} className="bg-cyber-accent/5 border border-cyber-accent/40 rounded-xl p-3 flex flex-col gap-2.5 animate-fade-in relative">
                            {inlineError && (
                              <div className="flex items-center gap-1 text-[9px] text-cyber-magenta font-bold">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {inlineError}
                              </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              {/* Word field */}
                              <div className="sm:col-span-4 flex flex-col gap-0.5">
                                <label className="text-[8px] text-gray-400">Word</label>
                                <input
                                  type="text"
                                  value={editWord}
                                  onChange={(e) => setEditWord(e.target.value)}
                                  className="bg-cyber-bg border border-cyber-accent/30 rounded px-2 py-1 text-white text-xs font-mono w-full"
                                />
                              </div>
                              {/* Vi meaning */}
                              <div className="sm:col-span-3 flex flex-col gap-0.5">
                                <label className="text-[8px] text-gray-400">{t('customWords.vietnameseTranslation')}</label>
                                <input
                                  type="text"
                                  value={editMeaningVi}
                                  onChange={(e) => setEditMeaningVi(e.target.value)}
                                  className="bg-cyber-bg border border-cyber-accent/30 rounded px-2 py-1 text-white text-xs w-full"
                                />
                              </div>
                              {/* Ja meaning */}
                              <div className="sm:col-span-3 flex flex-col gap-0.5">
                                <label className="text-[8px] text-gray-400">{t('customWords.japaneseTranslation')}</label>
                                <input
                                  type="text"
                                  value={editMeaningJa}
                                  onChange={(e) => setEditMeaningJa(e.target.value)}
                                  className="bg-cyber-bg border border-cyber-accent/30 rounded px-2 py-1 text-white text-xs w-full"
                                />
                              </div>
                              {/* Difficulty */}
                              <div className="sm:col-span-1.5 flex flex-col gap-0.5">
                                <label className="text-[8px] text-gray-400">Diff</label>
                                <select
                                  value={editDifficulty}
                                  onChange={(e) => setEditDifficulty(Number(e.target.value))}
                                  className="bg-cyber-bg border border-cyber-accent/30 rounded px-1 py-1 text-white text-xs"
                                >
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                </select>
                              </div>
                              {/* Emoji */}
                              <div className="sm:col-span-1 flex flex-col gap-0.5">
                                <label className="text-[8px] text-gray-400">Emoji</label>
                                <input
                                  type="text"
                                  value={editEmoji}
                                  onChange={(e) => setEditEmoji(e.target.value)}
                                  maxLength={2}
                                  className="bg-cyber-bg border border-cyber-accent/30 rounded px-1 py-1 text-center text-white text-xs"
                                />
                              </div>
                            </div>
                            
                            {/* Inline Actions */}
                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                type="button"
                                onClick={() => saveEditedWord(originalIndex)}
                                className="px-3 py-1 bg-cyber-green/10 hover:bg-cyber-green/30 border border-cyber-green/30 hover:border-cyber-green/60 text-cyber-green hover:text-white rounded font-bold uppercase transition-all tracking-wider text-[9px] flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditWord}
                                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 border border-transparent rounded text-gray-300 transition-all font-bold uppercase tracking-wider text-[9px] flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={originalIndex} className="bg-cyber-dark/50 border border-cyber-accent/5 hover:border-cyber-accent/15 rounded-xl p-2.5 flex items-center justify-between transition-all gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-grow">
                            <span className="text-base shrink-0 select-none">{entry.emoji || '✈️'}</span>
                            <div className="min-w-0 font-mono text-[10px]">
                              <div className="font-extrabold text-white uppercase truncate text-xs flex items-center gap-1.5">
                                <span>{entry.word}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  entry.difficulty === 1 
                                    ? 'bg-cyber-green/10 text-cyber-green border border-cyber-green/20' 
                                    : entry.difficulty === 3 
                                      ? 'bg-cyber-magenta/10 text-cyber-magenta border border-cyber-magenta/20 animate-pulse' 
                                      : 'bg-cyber-orange/10 text-cyber-orange border border-cyber-orange/20'
                                }`}>
                                  D{entry.difficulty}
                                </span>
                              </div>
                              <div className="text-gray-400 truncate font-sans text-[9px] mt-0.5 flex gap-2">
                                <span className="opacity-75">VI: <span className="text-white font-semibold">{entry.meaning_vi}</span></span>
                                <span className="text-gray-750">|</span>
                                <span className="opacity-75">JA: <span className="text-white font-semibold jp-text">{entry.meaning_ja}</span></span>
                              </div>
                            </div>
                          </div>

                          {/* Row Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {onEditWord && (
                              <button
                                type="button"
                                onClick={() => startEditWord(originalIndex, entry)}
                                className="p-1.5 hover:bg-cyber-accent/10 border border-transparent hover:border-cyber-accent/30 rounded text-cyber-accent transition-all cursor-pointer"
                                title="Edit Word"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteWord && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(t('customWords.confirmDeleteWord', { word: entry.word }))) {
                                    if (activeListId) onDeleteWord(activeListId, originalIndex);
                                  }
                                }}
                                className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded text-cyber-magenta transition-all cursor-pointer"
                                title="Delete Word"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-center py-16 border-2 border-dashed border-cyber-accent/10 rounded-2xl bg-cyber-dark/20 text-gray-500">
              <HelpCircle className="w-10 h-10 mb-2 text-cyber-accent/30 animate-pulse" />
              <p className="text-xs uppercase tracking-wider font-bold">{t('customWords.selectCategory')}</p>
              <p className="text-[10px] text-gray-600 mt-1 max-w-sm leading-normal">
                {t('customWords.selectCategoryDesc')}
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
