import type { DictionaryEntry, Level } from '../types/game';

/**
 * Normalizes a header string by converting to lowercase, trimming,
 * and removing spaces, dashes, and underscores.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const normalizeVocabularyHeader = (h: any): string => {
  if (h === undefined || h === null) return '';
  return String(h).toLowerCase().trim().replace(/[\s_-]/g, '');
};

/**
 * Robust CSV row parser supporting quoted fields and commas inside quotes.
 */
export const parseCSVRow = (rowText: string): string[] => {
  const result: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  
  for (let i = 0; i < rowText.length; i++) {
    const char = rowText[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentVal.trim());
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  result.push(currentVal.trim());
  
  return result.map(cell => {
    let c = cell.trim();
    if (c.startsWith('"') && c.endsWith('"')) {
      c = c.substring(1, c.length - 1).trim();
    }
    return c;
  });
};

/**
 * Validates a vocabulary entry, applying standard fallbacks if needed.
 * Returns the validated DictionaryEntry or null if invalid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateVocabularyEntry = (entry: any): DictionaryEntry | null => {
  if (!entry || typeof entry !== 'object') return null;

  const wordVal = entry.word ? String(entry.word).trim().toLowerCase() : '';
  const viVal = entry.meaning_vi ? String(entry.meaning_vi).trim() : '';
  const jaVal = entry.meaning_ja ? String(entry.meaning_ja).trim() : '';

  // Validation: word is absolutely required, and at least one meaning
  if (!wordVal) return null;
  if (!viVal && !jaVal) return null;

  // Fallbacks for missing translations
  const meaningViFinal = viVal || jaVal;
  const meaningJaFinal = jaVal || viVal;

  // Parse difficulty: 1-3, default to 2
  let diffVal = 2;
  if (entry.difficulty !== undefined && entry.difficulty !== null) {
    const val = parseInt(String(entry.difficulty).trim());
    if (!isNaN(val)) {
      diffVal = Math.max(1, Math.min(3, val));
    }
  }

  // Parse level: default to 'Eiken 5 Kyu'
  let levelVal: Level = 'Eiken 5 Kyu';
  if (entry.level) {
    const rawLvl = String(entry.level).trim();
    const validLevels: Level[] = [
      'Alphabet', 'Kids', 'Eiken 5 Kyu', 'Eiken 4 Kyu', 'Eiken 3 Kyu', 
      'Eiken Pre 2 Kyu', 'Eiken 2 Kyu', 'Eiken Pre 1 Kyu', 'Eiken 1 Kyu', 
      'TOEIC', 'IELTS', 'TOEFL'
    ];
    const found = validLevels.find(v => v.toLowerCase() === rawLvl.toLowerCase());
    if (found) {
      levelVal = found;
    }
  }

  const emojiVal = entry.emoji ? String(entry.emoji).trim() : undefined;

  return {
    word: wordVal,
    meaning_vi: meaningViFinal,
    meaning_ja: meaningJaFinal,
    level: levelVal,
    difficulty: diffVal,
    emoji: emojiVal || undefined,
  };
};

/**
 * Parses raw CSV text into validated DictionaryEntry items.
 * Handles UTF-8 BOM, line splits, and custom headers.
 */
export const parseCsvVocabulary = (text: string): DictionaryEntry[] => {
  // Strip UTF-8 BOM if present
  const cleanText = text.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/);
  const entries: DictionaryEntry[] = [];
  
  let headerMap: { [key: string]: number } = {};
  let isHeaderRow = true;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (!line) continue;

    const parts = parseCSVRow(line);

    if (isHeaderRow) {
      isHeaderRow = false;
      parts.forEach((cell, cellIdx) => {
        const norm = normalizeVocabularyHeader(cell);
        if (['word', 'english', 'en'].includes(norm)) {
          headerMap['word'] = cellIdx;
        } else if (['meaningvi', 'vi', 'vietnamese'].includes(norm)) {
          headerMap['meaning_vi'] = cellIdx;
        } else if (['meaningja', 'ja', 'japanese', 'japanese_meaning', 'jp'].includes(norm)) {
          headerMap['meaning_ja'] = cellIdx;
        } else if (['difficulty'].includes(norm)) {
          headerMap['difficulty'] = cellIdx;
        } else if (['emoji'].includes(norm)) {
          headerMap['emoji'] = cellIdx;
        } else if (['level'].includes(norm)) {
          headerMap['level'] = cellIdx;
        }
      });

      // Default indices if no headers matched
      if (headerMap['word'] === undefined) {
        headerMap = {
          'word': 0,
          'meaning_vi': 1,
          'meaning_ja': 2,
          'difficulty': 3,
          'emoji': 4
        };
      }
      continue;
    }

    const rawWord = headerMap['word'] !== undefined ? parts[headerMap['word']] : '';
    const rawVi = headerMap['meaning_vi'] !== undefined ? parts[headerMap['meaning_vi']] : '';
    const rawJa = headerMap['meaning_ja'] !== undefined ? parts[headerMap['meaning_ja']] : '';
    const rawDiff = headerMap['difficulty'] !== undefined ? parts[headerMap['difficulty']] : undefined;
    const rawEmoji = headerMap['emoji'] !== undefined ? parts[headerMap['emoji']] : undefined;
    const rawLvl = headerMap['level'] !== undefined ? parts[headerMap['level']] : undefined;

    const entry = validateVocabularyEntry({
      word: rawWord,
      meaning_vi: rawVi,
      meaning_ja: rawJa,
      difficulty: rawDiff,
      emoji: rawEmoji,
      level: rawLvl
    });

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};

/**
 * Robustly parses Excel ArrayBuffer by lazy-loading the xlsx library.
 * Reads the first sheet, maps headers flexibly, and returns validated entries.
 */
export const parseExcelVocabulary = async (data: ArrayBuffer): Promise<DictionaryEntry[]> => {
  // Dynamically import xlsx for lazy-loading to optimize initial bundle size
  const XLSX = await import('xlsx');

  const workbook = XLSX.read(data, { type: 'array' });
  if (workbook.SheetNames.length === 0) {
    throw new Error('errors.emptyExcelSheet');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Read sheet as an array of arrays (including header row)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
  if (jsonData.length === 0) {
    throw new Error('errors.emptyFile');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headerRow = jsonData[0] as any[];
  const colMap: { [key: string]: number } = {};

  headerRow.forEach((cell, idx) => {
    const norm = normalizeVocabularyHeader(cell);
    if (['word', 'english', 'en'].includes(norm)) {
      colMap['word'] = idx;
    } else if (['meaningvi', 'vi', 'vietnamese'].includes(norm)) {
      colMap['meaning_vi'] = idx;
    } else if (['meaningja', 'ja', 'japanese', 'japanese_meaning', 'jp'].includes(norm)) {
      colMap['meaning_ja'] = idx;
    } else if (['difficulty'].includes(norm)) {
      colMap['difficulty'] = idx;
    } else if (['emoji'].includes(norm)) {
      colMap['emoji'] = idx;
    } else if (['level'].includes(norm)) {
      colMap['level'] = idx;
    }
  });

  // Validation: word column is absolutely required
  if (colMap['word'] === undefined) {
    throw new Error('errors.missingWordColumn');
  }

  const entries: DictionaryEntry[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = jsonData[i] as any[];
    
    // Skip empty rows
    const isRowEmpty = !row || row.length === 0 || row.every(cell => cell === undefined || cell === null || String(cell).trim() === '');
    if (isRowEmpty) continue;

    const rawWord = row[colMap['word']];
    const rawVi = colMap['meaning_vi'] !== undefined ? row[colMap['meaning_vi']] : '';
    const rawJa = colMap['meaning_ja'] !== undefined ? row[colMap['meaning_ja']] : '';
    const rawDiff = colMap['difficulty'] !== undefined ? row[colMap['difficulty']] : undefined;
    const rawEmoji = colMap['emoji'] !== undefined ? row[colMap['emoji']] : undefined;
    const rawLvl = colMap['level'] !== undefined ? row[colMap['level']] : undefined;

    const entry = validateVocabularyEntry({
      word: rawWord,
      meaning_vi: rawVi,
      meaning_ja: rawJa,
      difficulty: rawDiff,
      emoji: rawEmoji,
      level: rawLvl
    });

    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
};

/**
 * Filters out entries that already exist in the list.
 */
export const dedupeVocabularyEntries = (
  entries: DictionaryEntry[],
  existingEntries: DictionaryEntry[]
): { uniqueEntries: DictionaryEntry[]; duplicateCount: number } => {
  const existingSet = new Set(existingEntries.map(e => e.word.toLowerCase()));
  const uniqueEntries: DictionaryEntry[] = [];
  let duplicateCount = 0;

  const seenInCurrentBatch = new Set<string>();

  entries.forEach(ent => {
    const w = ent.word.toLowerCase();
    if (existingSet.has(w) || seenInCurrentBatch.has(w)) {
      duplicateCount++;
    } else {
      seenInCurrentBatch.add(w);
      uniqueEntries.push(ent);
    }
  });

  return { uniqueEntries, duplicateCount };
};
