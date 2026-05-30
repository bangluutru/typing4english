import React, { useState } from 'react';
import type { UILanguage, DictionaryEntry } from '../../types/game';
import { useTranslation } from '../../i18n/useTranslation';
import { 
  Plus, 
  FileInput, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { 
  parseCsvVocabulary, 
  parseExcelVocabulary, 
  dedupeVocabularyEntries, 
  validateVocabularyEntry 
} from '../../utils/importVocabulary';

interface VocabularyImporterProps {
  uiLanguage: UILanguage;
  activeListId: string;
  activeListEntries: DictionaryEntry[];
  onImportWords: (listId: string, entries: DictionaryEntry[]) => void;
}

export const VocabularyImporter: React.FC<VocabularyImporterProps> = ({
  uiLanguage,
  activeListId,
  activeListEntries,
  onImportWords,
}) => {
  const t = useTranslation(uiLanguage);

  // Importer states
  const [importText, setImportText] = useState('');
  const [importType, setImportType] = useState<'csv' | 'json'>('csv');
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [activeImportTab, setActiveImportTab] = useState<'upload' | 'paste'>('upload');
  const [importPreview, setImportPreview] = useState<DictionaryEntry[]>([]);

  // Excel/CSV File uploader states
  const [fileFeedback, setFileFeedback] = useState<{
    success: boolean;
    msg: string;
    details?: {
      rowsRead: number;
      wordsAdded: number;
      invalidRows: number;
      duplicateWords: number;
    };
  } | null>(null);

  const handleImport = () => {
    setImportFeedback(null);
    setImportPreview([]);
    if (!activeListId || !importText.trim()) return;

    try {
      let entries: DictionaryEntry[] = [];

      if (importType === 'csv') {
        entries = parseCsvVocabulary(importText);
      } else {
        const parsed = JSON.parse(importText);
        if (!Array.isArray(parsed)) {
          throw new Error('Định dạng JSON phải là một mảng danh sách từ vựng');
        }

        parsed.forEach((item, idx) => {
          const validated = validateVocabularyEntry(item);
          if (!validated) {
            throw new Error(`Phần tử thứ ${idx + 1} không hợp lệ (cần 'word' và ít nhất một nghĩa dịch)`);
          }
          entries.push(validated);
        });
      }

      if (entries.length === 0) {
        throw new Error('Không tìm thấy dữ liệu từ vựng hợp lệ để nhập');
      }

      // Duplicate detection
      const { uniqueEntries } = dedupeVocabularyEntries(entries, activeListEntries);

      if (uniqueEntries.length > 0) {
        onImportWords(activeListId, uniqueEntries);
      }

      setImportFeedback({
        success: true,
        msg: t('importSuccess', { count: uniqueEntries.length }),
      });
      
      setImportPreview(entries.slice(0, 3));
      setImportText('');
    } catch (e) {
      const err = e as Error;
      setImportFeedback({
        success: false,
        msg: err.message || 'Lỗi phân tích cú pháp dữ liệu nhập',
      });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileFeedback(null);
    setImportPreview([]);
    if (!activeListId) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'csv' && fileExt !== 'xlsx' && fileExt !== 'xls') {
      setFileFeedback({
        success: false,
        msg: t('unsupportedFileType'),
      });
      e.target.value = '';
      return;
    }

    if (fileExt === 'csv') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          const entries = parseCsvVocabulary(text);
          
          if (entries.length === 0) {
            throw new Error('Không tìm thấy dữ liệu từ vựng hợp lệ để nhập');
          }

          // Duplicate detection
          const { uniqueEntries, duplicateCount } = dedupeVocabularyEntries(entries, activeListEntries);

          if (uniqueEntries.length > 0) {
            onImportWords(activeListId, uniqueEntries);
          }

          setFileFeedback({
            success: true,
            msg: t('importSuccess', { count: uniqueEntries.length }),
            details: {
              rowsRead: entries.length,
              wordsAdded: uniqueEntries.length,
              invalidRows: 0,
              duplicateWords: duplicateCount,
            }
          });

          setImportPreview(entries.slice(0, 3));
        } catch (err) {
          const error = err as Error;
          setFileFeedback({
            success: false,
            msg: error.message || 'Lỗi phân tích cú pháp dữ liệu file CSV',
          });
        } finally {
          e.target.value = '';
        }
      };

      reader.onerror = () => {
        setFileFeedback({
          success: false,
          msg: 'Không thể đọc được file này',
        });
        e.target.value = '';
      };

      reader.readAsText(file, 'utf-8');
    } else {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = evt.target?.result as ArrayBuffer;
          
          // Lazy loads xlsx inside parseExcelVocabulary!
          const entries = await parseExcelVocabulary(data);
          
          if (entries.length === 0) {
            throw new Error('Không tìm thấy dữ liệu từ vựng hợp lệ để nhập');
          }

          // Duplicate detection
          const { uniqueEntries, duplicateCount } = dedupeVocabularyEntries(entries, activeListEntries);

          if (uniqueEntries.length > 0) {
            onImportWords(activeListId, uniqueEntries);
          }

          setFileFeedback({
            success: true,
            msg: t('importSuccess', { count: uniqueEntries.length }),
            details: {
              rowsRead: entries.length,
              wordsAdded: uniqueEntries.length,
              invalidRows: 0,
              duplicateWords: duplicateCount,
            }
          });

          setImportPreview(entries.slice(0, 3));
        } catch (err) {
          const error = err as Error;
          setFileFeedback({
            success: false,
            msg: error.message || 'Lỗi phân tích cú pháp dữ liệu file Excel',
          });
        } finally {
          e.target.value = '';
        }
      };

      reader.onerror = () => {
        setFileFeedback({
          success: false,
          msg: 'Không thể đọc được file này',
        });
        e.target.value = '';
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="lg:col-span-7 flex flex-col gap-3 bg-cyber-dark/20 border border-cyber-accent/5 rounded-xl p-3.5 justify-between h-full">
      
      {/* Tab Selector */}
      <div className="flex border-b border-cyber-accent/10 pb-1.5 flex-shrink-0 gap-4 mb-1">
        <button
          type="button"
          onClick={() => setActiveImportTab('upload')}
          className={`font-bold pb-1 text-[10px] uppercase tracking-wide transition-all border-b-2 cursor-pointer ${
            activeImportTab === 'upload' ? 'border-cyber-accent text-cyber-accent' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          {t('tabUpload')}
        </button>
        <button
          type="button"
          onClick={() => setActiveImportTab('paste')}
          className={`font-bold pb-1 text-[10px] uppercase tracking-wide transition-all border-b-2 cursor-pointer ${
            activeImportTab === 'paste' ? 'border-cyber-accent text-cyber-accent' : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          {t('tabPaste')}
        </button>
      </div>

      {/* Tab 1: Upload CSV/Excel */}
      {activeImportTab === 'upload' && (
        <div className="flex flex-col gap-3 flex-grow justify-between">
          <div>
            {fileFeedback && (
              <div className={`flex flex-col gap-1.5 p-3 border rounded text-[10px] mb-2 ${
                fileFeedback.success 
                  ? 'bg-green-950/20 border-green-500/30 text-cyber-green' 
                  : 'bg-red-950/20 border-red-500/30 text-cyber-magenta'
              }`}>
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
                  {fileFeedback.success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {fileFeedback.msg}
                </div>
                {fileFeedback.details && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-[9px] text-gray-400 font-mono">
                    <span>Số hàng đã đọc: {fileFeedback.details.rowsRead}</span>
                    <span>Từ được thêm: {fileFeedback.details.wordsAdded}</span>
                    <span>Từ bị trùng: {fileFeedback.details.duplicateWords}</span>
                  </div>
                )}
              </div>
            )}

            <div className="text-[10px] text-gray-400 leading-relaxed mb-3">
              {uiLanguage === 'vi' 
                ? 'Hỗ trợ tải lên file CSV hoặc Excel (.xlsx, .xls) chứa danh sách từ vựng. Đảm bảo cấu trúc file chứa ít nhất hai cột: cột 1 là "Từ vựng (English)", cột 2 là "Nghĩa tiếng Việt" hoặc "Nghĩa tiếng Nhật". Cột 3 có thể là độ khó (1-3).' 
                : uiLanguage === 'ja'
                  ? '単語帳をインポートするためのCSVまたはExcelファイル（.xlsx、.xls）のアップロードをサポートします。ファイル構造には、少なくとも2つの列（列1：「単語（英語）」、列2：「ベトナム語の意味」または「日本語の意味」）が含まれていることを確認してください。列3は難易度（1-3）です。'
                  : 'Support uploading CSV or Excel files (.xlsx, .xls) containing vocabularies. Ensure the file structure has at least two columns: column 1 for "Word (English)", column 2 for "Vietnamese Meaning" or "Japanese Meaning". Column 3 can be difficulty (1-3).'}
            </div>
          </div>

          <div className="relative w-full">
            <input 
              type="file"
              accept=".csv, .xlsx, .xls"
              id="vocabulary-file-upload"
              onChange={handleFileImport}
              className="hidden"
            />
            <label 
              htmlFor="vocabulary-file-upload"
              className="w-full py-3 bg-cyber-accent/15 hover:bg-cyber-accent/35 border border-dashed border-cyber-accent/40 hover:border-cyber-accent/80 text-cyber-accent hover:text-white rounded-xl font-bold uppercase transition-all tracking-wider text-[10px] flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <FileInput className="w-5 h-5 animate-pulse" />
              <span>{uiLanguage === 'vi' ? 'Chọn Tập Tin' : uiLanguage === 'ja' ? 'ファイルを選択' : 'Choose File'}</span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 2: Copy & Paste Text */}
      {activeImportTab === 'paste' && (
        <div className="flex flex-col gap-2.5 flex-grow">
          {importFeedback && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded text-[10px] ${
              importFeedback.success 
                ? 'bg-green-950/20 border-green-500/30 text-cyber-green' 
                : 'bg-red-950/20 border-red-500/30 text-cyber-magenta'
            }`}>
              {importFeedback.success ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span className="font-bold">{importFeedback.msg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-[9px] text-gray-400 uppercase tracking-wider">{uiLanguage === 'vi' ? 'Dán dữ liệu:' : uiLanguage === 'ja' ? 'データを貼り付け:' : 'Paste data:'}</label>
            <div className="flex gap-2">
              <label className="flex items-center gap-1 cursor-pointer text-[9px] text-gray-400">
                <input 
                  type="radio"
                  name="importType"
                  checked={importType === 'csv'}
                  onChange={() => setImportType('csv')}
                  className="accent-cyber-accent"
                />
                CSV / Raw Text
              </label>
              <label className="flex items-center gap-1 cursor-pointer text-[9px] text-gray-400">
                <input 
                  type="radio"
                  name="importType"
                  checked={importType === 'json'}
                  onChange={() => setImportType('json')}
                  className="accent-cyber-accent"
                />
                JSON Array
              </label>
            </div>
          </div>

          <textarea 
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={
              importType === 'csv' 
                ? "word1,nghĩa Việt,nghĩa Nhật,difficulty\nword2,nghĩa Việt,nghĩa Nhật,difficulty..."
                : '[\n  { "word": "hello", "meaning_vi": "xin chào", "meaning_ja": "こんにちは", "difficulty": 1 }\n]'
            }
            rows={4}
            className="w-full bg-cyber-bg border border-cyber-accent/15 focus:border-cyber-accent rounded px-2.5 py-1.5 text-white text-xs outline-none transition-all font-mono resize-none flex-grow"
          />

          <button 
            type="button"
            onClick={handleImport}
            className="w-full py-1.5 bg-cyber-accent/15 hover:bg-cyber-accent/35 border border-cyber-accent/30 hover:border-cyber-accent/60 text-cyber-accent hover:text-white rounded font-bold uppercase transition-all tracking-wider text-[10px] flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> {uiLanguage === 'vi' ? 'Nhập Từ' : uiLanguage === 'ja' ? 'インポート' : 'Import Words'}
          </button>
        </div>
      )}

      {/* Shareable Import Preview Area */}
      {importPreview.length > 0 && (
        <div className="bg-cyber-dark/40 border border-cyber-accent/10 rounded-xl p-2.5 flex-shrink-0 font-mono text-[9px] text-gray-400">
          <span className="font-bold text-cyber-accent block mb-1 uppercase tracking-wide">Xem trước dữ liệu nhập:</span>
          <div className="flex flex-col gap-1">
            {importPreview.map((item, idx) => (
              <div key={idx} className="truncate">
                {idx + 1}. <b className="text-white">{item.word}</b> - VI: {item.meaning_vi || 'N/A'} | JP: {item.meaning_ja || 'N/A'} (Diff: {item.difficulty})
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
