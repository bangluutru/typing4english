import type { GradeId } from './store';
import type { Word } from './vocab';
import { shuffle } from './vocab';

/* --------------------------------------------------------------------------
   Touch-typing course for 8–15 year olds.

   Order follows the classic home → top → bottom progression, one finger pair
   at a time, and only then adds Shift, punctuation and numbers. Every drill is
   generated fresh from the keys learnt so far (no memorising a fixed text), and
   as soon as enough letters are known the drills use real English words.
   Late stages type example sentences from 英級アップ.
   -------------------------------------------------------------------------- */

type LessonKind = 'keys' | 'words' | 'shift' | 'sentences';

export interface Lesson {
  id: string;
  stage: number;
  newKeys: string[];
  /** Letters/characters allowed in this lesson (everything learnt so far + new). */
  allowed: string;
  kind: LessonKind;
  /** Keys-per-minute needed for the 2nd star. */
  target: number;
  /** Sentence lessons draw example sentences from this grade. */
  grade?: GradeId;
}

export interface Stage { n: number; icon: string; color: 'teal' | 'green' | 'orange' | 'violet' | 'coral' }

export const STAGES: Stage[] = [
  { n: 1, icon: '🏠', color: 'teal' },
  { n: 2, icon: '⬆️', color: 'green' },
  { n: 3, icon: '⬇️', color: 'orange' },
  { n: 4, icon: '🔠', color: 'violet' },
  { n: 5, icon: '🔢', color: 'coral' },
  { n: 6, icon: '🏆', color: 'teal' },
];

type Spec = [stage: number, newKeys: string, kind: LessonKind, target: number, grade?: GradeId];
const SPECS: Spec[] = [
  [1, 'fj', 'keys', 35], [1, 'dk', 'keys', 35], [1, 'sl', 'keys', 35], [1, 'a;', 'keys', 35], [1, 'gh', 'keys', 35], [1, '', 'words', 40],
  [2, 'ei', 'keys', 45], [2, 'ru', 'keys', 45], [2, 'ty', 'keys', 45], [2, 'wo', 'keys', 45], [2, 'qp', 'keys', 45], [2, '', 'words', 50],
  [3, 'nm', 'keys', 50], [3, 'vb', 'keys', 50], [3, 'c,', 'keys', 50], [3, 'x.', 'keys', 50], [3, 'z', 'keys', 50], [3, '', 'words', 55],
  [4, 'A', 'shift', 50], [4, '?!', 'shift', 50], [4, "'", 'shift', 50], [4, '', 'sentences', 55, '5'],
  [5, '12345', 'keys', 45], [5, '67890', 'keys', 45], [5, '', 'sentences', 55, '5'],
  [6, '', 'sentences', 65, '4'], [6, '', 'sentences', 70, '3'], [6, '', 'sentences', 75, 'pre2'],
];

export const LESSONS: Lesson[] = (() => {
  let allowed = ' ';
  const perStage: Record<number, number> = {};
  return SPECS.map(([stage, newKeys, kind, target, grade]) => {
    perStage[stage] = (perStage[stage] ?? 0) + 1;
    if (kind === 'keys') allowed += newKeys;
    if (kind === 'shift') allowed += newKeys === 'A' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : newKeys;
    return { id: `${stage}-${perStage[stage]}`, stage, newKeys: newKeys === 'A' ? [] : newKeys.split(''), allowed, kind, target, grade };
  });
})();

export const lessonById = (id: string) => LESSONS.find(l => l.id === id);

/* ---------- scoring ---------- */

export const PASS_ACC = 90;
export function starsFor(lesson: Lesson, acc: number, kpm: number): number {
  if (acc < PASS_ACC) return 0;
  if (acc >= 97 && kpm >= lesson.target * 1.4) return 3;
  if (acc >= 94 && kpm >= lesson.target) return 2;
  return 1;
}

/* ---------- word bank for early drills (kid-friendly, common words) ---------- */

const BANK = `a add ads all ask asks dad dads fall falls flag flags gas glad glass half hall has lad sad salad shall flash dash hash
as ask had has shall lass
I at eat ate tea sea see she he her here hi his is it its sit site like likes let led red read ride rid rule true tree free
fire fruit guitar four our out outside day days fly sky kite key keys yes yet yell yellow they the this that these there
we were wet west wide wife will with what water word world work story stop star start sister toy two too tool pet pets
put quiet quite quick queen pop post pool pay play player page paper people pie pipe pure top type your you road room
rose ride right light high sight fight tight lot lots lost foot food good goods look looks book books cook cooks
door floor our hour flower power tower yellow hello follow pillow window
new news nine name man men many my me mom mum map milk mix box fox six next text taxi zoo zero size lazy crazy quiz
can cat cats cake cup come came city cold color clock class climb catch much such lunch bench beach bag bed bike big
blue bus but by bye back body buy baby boy book ball black brown bread breakfast bank vote very voice five live love
move even never over seven every eleven van visit cave give have gave view vegetable vacation
jump jam jog just juice job join enjoy just kind king kick kid knee know knife snow slow sleep small smile snake spring
summer sun sunny swim swimming table take talk tall teach teacher tell ten test than thank thing think three time tired
today tomorrow train tree try under up use usually wait walk want warm wash watch way wear weather week well went white
who why win winter wish woman women write writing year young zebra`.split(/\s+/).filter(Boolean);

const uniq = <T,>(a: T[]) => [...new Set(a)];

function wordsFor(allowed: string, extra: Word[] = []): string[] {
  const ok = (w: string) => w.length >= 2 && [...w].every(c => allowed.includes(c));
  return uniq([...BANK, ...extra.map(w => w.w)].filter(ok));
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Group of 2–4 characters, weighted towards the lesson's new keys. */
function drillGroup(newKeys: string[], old: string[], len: number, newWeight: number) {
  let g = '';
  for (let i = 0; i < len; i++) g += old.length && Math.random() > newWeight ? pick(old) : pick(newKeys);
  return g;
}

const LINE_CHARS = 26;

function fitLine(parts: string[]): string {
  let line = '';
  for (const p of parts) {
    if ((line + ' ' + p).trim().length > LINE_CHARS && line) break;
    line = (line + ' ' + p).trim();
  }
  return line;
}

/**
 * Build the lines for one play of a lesson. `vocab` (optional) is the grade 5
 * list for word drills or the lesson grade's list for sentences.
 */
export function buildLines(lesson: Lesson, vocab: Word[] = []): string[] {
  const letters = [...lesson.allowed].filter(c => c !== ' ');
  const lower = letters.filter(c => /[a-z;,.]/.test(c));
  const learnt = lower.filter(c => !lesson.newKeys.includes(c));

  if (lesson.kind === 'keys') {
    const nk = lesson.newKeys;
    const lines: string[] = [];
    // 1–2: the new keys alone, in short repeated groups ("fff jjj fj jf").
    for (let i = 0; i < 2; i++) {
      const parts: string[] = [];
      while (parts.join(' ').length < LINE_CHARS) {
        const k = pick(nk);
        parts.push(Math.random() < 0.4 ? k.repeat(3) : drillGroup(nk, [], 2 + Math.floor(Math.random() * 2), 1));
      }
      lines.push(fitLine(parts));
    }
    // 3: new keys mixed with the ones already learnt.
    // Digits mix with digits learnt before (not letters); letters mix with letters.
    const digitLesson = /\d/.test(nk[0]);
    const pool = digitLesson ? letters.filter(c => /\d/.test(c) && !nk.includes(c)) : learnt;
    const mix: string[] = [];
    while (mix.join(' ').length < LINE_CHARS) mix.push(drillGroup(nk, pool, 2 + Math.floor(Math.random() * 3), 0.55));
    lines.push(fitLine(mix));
    // 4: real words that contain a new key, when there are any.
    const letterKeys = nk.filter(k => /[a-z]/.test(k));
    const words = wordsFor(lesson.allowed, vocab).filter(w => letterKeys.some(k => w.includes(k)));
    if (words.length >= 4) lines.push(fitLine(shuffle(words)));
    else {
      const more: string[] = [];
      while (more.join(' ').length < LINE_CHARS) more.push(drillGroup(nk, learnt, 3, 0.5));
      lines.push(fitLine(more));
    }
    // Digits lesson: finish with a line of numbers the child might actually type.
    if (digitLesson) lines[3] = fitLine(shuffle(NUMBER_WORDS.filter(w => [...w].every(c => lesson.allowed.includes(c)))));
    return lines;
  }

  if (lesson.kind === 'words') {
    const words = shuffle(wordsFor(lesson.allowed, vocab));
    const lines: string[] = [];
    for (let i = 0; i < 4; i++) lines.push(fitLine(words.slice(i * 6, i * 6 + 6).length ? words.slice(i * 6, i * 6 + 6) : shuffle(words)));
    return lines;
  }

  if (lesson.kind === 'shift') {
    const bank = SHIFT_LINES[lesson.newKeys.join('') || 'A'];
    return shuffle(bank).slice(0, 4);
  }

  // sentences
  const sentences = vocab
    .map(w => w.ex)
    .filter((s): s is string => !!s && s.length >= 12 && s.length <= 42 && [...s].every(c => lesson.allowed.includes(c)));
  const picked = shuffle(uniq(sentences)).slice(0, 4);
  const lines = picked.length >= 3 ? picked : shuffle(FALLBACK_SENTENCES).slice(0, 4);
  // The numbers stage: half the sentences carry numbers.
  if (lesson.stage === 5) return shuffle([...shuffle(NUMBER_SENTENCES).slice(0, 2), ...lines.slice(0, 2)]);
  return lines;
}

const SHIFT_LINES: Record<string, string[]> = {
  A: ['I like Tom and Emi.', 'Ken is from Japan.', 'We live in Tokyo.', 'Hello, Mr. Brown.', 'I see Mt. Fuji.',
    'Sunday and Monday', 'Aki and Yuki play.', 'Nice to meet you, Ms. Green.', 'I love Osaka.', 'Hi, I am Sora.'],
  '?!': ['What is this?', 'Who is she?', 'Yes, I can!', 'Good job!', 'Where is my bag?', 'How are you?', 'Wow, nice!',
    'Can you swim?', 'Help me, please!', 'Is it a cat?'],
  "'": ["I'm Ken.", "It's a dog.", "Let's go!", "I don't know.", "That's my pen.", "What's this?", "She's my sister.",
    "It's sunny today.", "Let's play soccer!", "I can't swim."],
};

const NUMBER_WORDS = ['10 cats', '3 dogs', '25 kids', '100 yen', '12 eggs', '4 apples', '2 pens', '31 days', '5 balls', '1 sun'];
const NUMBER_SENTENCES = ['I am 12 years old.', 'I have 2 brothers.', 'It is 7 in the morning.', 'We have 35 students.',
  'This book is 500 yen.', 'My birthday is May 5.', 'I get up at 6.', 'There are 12 months in a year.', 'I can count to 100!'];

const FALLBACK_SENTENCES = ['I like apples.', 'This is my bag.', 'We play tennis on Sunday.', 'My sister is ten.',
  'It is sunny today.', 'I have two cats.', 'Do you like music?', 'Let us go to school.'];

/** Unlock rule: first lesson open; each next one needs a star on the previous. */
export function isUnlocked(i: number, stars: (id: string) => number) {
  return i === 0 || stars(LESSONS[i - 1].id) > 0;
}
