import { useEffect, useState } from 'react';
import type { GradeId, MeaningLang, UiLang } from './store';

/* Vocabulary from 英級アップ (eikyu-up), synced by scripts/sync-eikyu-vocab.mjs. */

export interface Word {
  id: string;
  w: string;
  ipa?: string;
  pos?: string;
  t: string;       // topic id
  ja: string;
  vi?: string;
  ex?: string;
  exJa?: string;
  exVi?: string;
  a?: string;      // word audio file
  ea?: string;     // example audio file
}

export const GRADES: GradeId[] = ['5', '4', '3', 'pre2', '2', 'pre1', '1'];

export const GRADE_INFO: Record<GradeId, { ja: string; en: string; vi: string; color: string; level: { ja: string; vi: string; en: string } }> = {
  '5':    { ja: '5級',  en: 'Grade 5',   vi: 'Cấp 5',    color: 'green',  level: { ja: '[小学生|しょうがくせい]', vi: 'Tiểu học', en: 'Elementary' } },
  '4':    { ja: '4級',  en: 'Grade 4',   vi: 'Cấp 4',    color: 'teal',   level: { ja: '[小学|しょうがく][高学年|こうがくねん]〜[中|ちゅう]1', vi: 'Cuối tiểu học – lớp 7', en: 'Upper elem. – JHS 1' } },
  '3':    { ja: '3級',  en: 'Grade 3',   vi: 'Cấp 3',    color: 'orange', level: { ja: '[中学|ちゅうがく][卒業|そつぎょう]', vi: 'Hết THCS', en: 'JHS graduate' } },
  'pre2': { ja: '準2級', en: 'Grade Pre-2', vi: 'Chuẩn cấp 2', color: 'violet', level: { ja: '[高校|こうこう][中級|ちゅうきゅう]', vi: 'Giữa THPT', en: 'Mid high school' } },
  '2':    { ja: '2級',  en: 'Grade 2',   vi: 'Cấp 2',    color: 'coral',  level: { ja: '[高校|こうこう][卒業|そつぎょう]', vi: 'Hết THPT', en: 'HS graduate' } },
  'pre1': { ja: '準1級', en: 'Grade Pre-1', vi: 'Chuẩn cấp 1', color: 'violet', level: { ja: '[大学|だいがく][中級|ちゅうきゅう]', vi: 'Đại học', en: 'University' } },
  '1':    { ja: '1級',  en: 'Grade 1',   vi: 'Cấp 1',    color: 'coral',  level: { ja: '[大学|だいがく][上級|じょうきゅう]', vi: 'Nâng cao', en: 'Advanced' } },
};

export const gradeName = (g: GradeId, lang: UiLang) =>
  lang === 'ja' ? `[英検|えいけん] ${GRADE_INFO[g].ja}` : lang === 'vi' ? `Eiken ${GRADE_INFO[g].vi}` : `Eiken ${GRADE_INFO[g].en}`;

export const TOPICS: Record<string, { icon: string; ja: string; vi: string; en: string }> = {
  family:        { icon: '👨‍👩‍👧', ja: '[家族|かぞく]', vi: 'Gia đình', en: 'Family' },
  body:          { icon: '🖐️', ja: 'からだ', vi: 'Cơ thể', en: 'Body' },
  colors:        { icon: '🎨', ja: 'いろ', vi: 'Màu sắc', en: 'Colors' },
  numbers:       { icon: '🔢', ja: '[数|かず]と[時間|じかん]', vi: 'Số và thời gian', en: 'Numbers & time' },
  food:          { icon: '🍙', ja: '[食|た]べもの', vi: 'Đồ ăn', en: 'Food & drink' },
  animals:       { icon: '🐶', ja: '[動物|どうぶつ]', vi: 'Động vật', en: 'Animals' },
  clothing:      { icon: '👕', ja: '[服|ふく]', vi: 'Quần áo', en: 'Clothes' },
  school:        { icon: '🏫', ja: '[学校|がっこう]', vi: 'Trường học', en: 'School' },
  places:        { icon: '🗺️', ja: '[場所|ばしょ]・のりもの', vi: 'Nơi chốn, đi lại', en: 'Places & travel' },
  people:        { icon: '🧑‍🍳', ja: '[人|ひと]・しごと', vi: 'Con người, nghề', en: 'People & jobs' },
  things:        { icon: '🎒', ja: 'もの', vi: 'Đồ vật', en: 'Things' },
  weather:       { icon: '🌦️', ja: '[天気|てんき]・[自然|しぜん]', vi: 'Thời tiết, thiên nhiên', en: 'Weather & nature' },
  sports:        { icon: '⚽', ja: 'スポーツ・しゅみ', vi: 'Thể thao, sở thích', en: 'Sports & hobbies' },
  daily:         { icon: '🏠', ja: 'くらし', vi: 'Đời sống', en: 'Daily life' },
  feelings:      { icon: '😊', ja: '[気持|きも]ち', vi: 'Cảm xúc', en: 'Feelings' },
  communication: { icon: '💬', ja: 'コミュニケーション', vi: 'Giao tiếp', en: 'Communication' },
  society:       { icon: '🏙️', ja: '[社会|しゃかい]', vi: 'Xã hội', en: 'Society' },
  arts:          { icon: '🎵', ja: 'げいじゅつ', vi: 'Nghệ thuật', en: 'Arts' },
  science:       { icon: '🔬', ja: '[科学|かがく]', vi: 'Khoa học', en: 'Science' },
  business:      { icon: '💼', ja: 'ビジネス', vi: 'Kinh tế', en: 'Business' },
  law:           { icon: '⚖️', ja: '[法律|ほうりつ]・[政治|せいじ]', vi: 'Luật, chính trị', en: 'Law & politics' },
  history:       { icon: '🏛️', ja: '[歴史|れきし]・[思想|しそう]', vi: 'Lịch sử, tư tưởng', en: 'History & ideas' },
  idioms:        { icon: '🧩', ja: 'じゅく[語|ご]', vi: 'Thành ngữ', en: 'Idioms & phrases' },
  connectors:    { icon: '🔗', ja: 'つなぐことば', vi: 'Từ nối, trạng từ', en: 'Linking words' },
  verbs:         { icon: '🏃', ja: '[動|うご]きのことば', vi: 'Động từ', en: 'Verbs' },
  adjectives:    { icon: '✨', ja: 'ようすのことば', vi: 'Tính từ', en: 'Adjectives' },
  academic:      { icon: '📚', ja: '[学習|がくしゅう]のことば', vi: 'Từ học thuật', en: 'Academic words' },
  more:          { icon: '➕', ja: 'そのほか', vi: 'Từ khác', en: 'More words' },
};

export const topicName = (id: string, lang: UiLang) => TOPICS[id]?.[lang] ?? id;

export const meaningOf = (w: Word, lang: MeaningLang) => (lang === 'vi' ? w.vi || w.ja : w.ja);
export const exampleMeaningOf = (w: Word, lang: MeaningLang) => (lang === 'vi' ? w.exVi || w.exJa : w.exJa);

export interface VocabIndex {
  source: string;
  syncedAt: string;
  grades: Record<GradeId, { count: number; topics: Record<string, number> }>;
}

const cache = new Map<string, Promise<unknown>>();
function load<T>(file: string): Promise<T> {
  let p = cache.get(file);
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}data/vocab/${file}`).then(r => {
      if (!r.ok) throw new Error(`${file}: ${r.status}`);
      return r.json();
    });
    p.catch(() => cache.delete(file));
    cache.set(file, p);
  }
  return p as Promise<T>;
}

const loadGrade = (g: GradeId) => load<Word[]>(`${g}.json`);
const loadIndex = () => load<VocabIndex>('index.json');

export function useGrade(g: GradeId | null) {
  const [state, setState] = useState<{ grade: GradeId | null; words: Word[] | null; error: boolean }>({ grade: null, words: null, error: false });
  useEffect(() => {
    if (!g) return;
    let alive = true;
    loadGrade(g).then(
      words => alive && setState({ grade: g, words, error: false }),
      () => alive && setState({ grade: g, words: null, error: true }),
    );
    return () => { alive = false; };
  }, [g]);
  const ready = state.grade === g;
  return { words: ready ? state.words : null, error: ready && state.error };
}

export function useVocabIndex() {
  const [idx, setIdx] = useState<VocabIndex | null>(null);
  useEffect(() => { loadIndex().then(setIdx, () => {}); }, []);
  return idx;
}

const SET_SIZE = 8;

/** Split a topic's words (in eikyu-up's teaching order) into small study sets. */
export function topicSets(words: Word[], topic: string): Word[][] {
  const list = words.filter(w => w.t === topic);
  const sets: Word[][] = [];
  for (let i = 0; i < list.length; i += SET_SIZE) sets.push(list.slice(i, i + SET_SIZE));
  // Don't leave a lonely 1–2 word set at the end.
  if (sets.length > 1 && sets[sets.length - 1].length < 4) {
    const last = sets.pop()!;
    sets[sets.length - 1].push(...last);
  }
  return sets;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
