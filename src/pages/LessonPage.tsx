import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { LESSONS, buildLines, lessonById, starsFor, PASS_ACC, isUnlocked, type Lesson } from '../lib/curriculum';
import { keyFor } from '../lib/keyboard';
import { logActivity, recordKeyStats, recordLesson, useProgress, useSettings } from '../lib/store';
import { accOf, emptyStats, kpmOf, mergeStats, useLineTyping, type LineStats } from '../lib/typing';
import { useGrade } from '../lib/vocab';
import { useT, type TKey } from '../lib/i18n';
import { href, navigate } from '../lib/router';
import { sfx } from '../lib/audio';
import { Keyboard } from '../components/Keyboard';
import { Hands } from '../components/Hands';
import { TypingLine } from '../components/TypingLine';
import { InputWarning, ProgressBar, Stars, Stat } from '../components/ui';
import { lessonLabel } from '../lib/learning';

type Phase = 'intro' | 'play' | 'result';

export function LessonPage({ id }: { id: string }) {
  const lesson = lessonById(id);
  const progress = useProgress();
  const index = LESSONS.findIndex(l => l.id === id);
  const stars = (lid: string) => progress.lessons[lid]?.stars ?? 0;

  if (!lesson || !isUnlocked(index, stars)) {
    return <NotAvailable />;
  }
  // key: restart all state when moving to another lesson
  return <LessonRunner key={id} lesson={lesson} index={index} />;
}

function NotAvailable() {
  const { t } = useT();
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="mb-2 text-4xl">🔒</div>
      <p className="mb-4 font-bold">{t('lesson.locked')}</p>
      <a className="btn btn-primary" href={href('typing')}>{t('lesson.backToList')}</a>
    </div>
  );
}

function LessonRunner({ lesson, index }: { lesson: Lesson; index: number }) {
  const { t, s, lang } = useT();
  const [settings] = useSettings();
  const needsVocab = lesson.kind === 'sentences' || lesson.kind === 'words';
  const { words: vocab } = useGrade(needsVocab ? (lesson.kind === 'words' ? '5' : lesson.grade ?? '5') : null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [total, setTotal] = useState<LineStats>(emptyStats);
  const [result, setResult] = useState<{ stars: number; kpm: number; acc: number; sec: number; weak: string[]; first: boolean } | null>(null);
  const progress = useProgress();
  const hadStarsBefore = useRef(progress.lessons[lesson.id]?.stars ?? 0);

  const vocabReady = !needsVocab || vocab !== null;
  // Fresh lines each attempt (round), so nothing can be memorised.
  const lines = useMemo(() => (vocabReady ? buildLines(lesson, vocab ?? []) : []), [lesson, vocab, vocabReady, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = lines[lineIdx] ?? '';
  const charsBefore = lines.slice(0, lineIdx).reduce((n, l) => n + l.length, 0);
  const charsTotal = lines.reduce((n, l) => n + l.length, 0);

  const start = useCallback(() => {
    setTotal(emptyStats());
    setLineIdx(0);
    setResult(null);
    setPhase('play');
  }, []);

  const restart = () => { setRound(r => r + 1); start(); };

  const onDone = useCallback((st: LineStats) => {
    sfx.word();
    const sum = mergeStats(total, st);
    setTotal(sum);
    if (lineIdx + 1 < lines.length) {
      setTimeout(() => setLineIdx(i => i + 1), 250);
      return;
    }
    const acc = accOf(sum);
    const kpm = kpmOf(sum);
    const stars = starsFor(lesson, acc, kpm);
    const weak = Object.entries(sum.keys)
      .filter(([k, v]) => v.miss > 0 && k !== ' ')
      .sort((a, b) => b[1].miss - a[1].miss)
      .slice(0, 4)
      .map(([k]) => k);
    recordLesson(lesson.id, stars, kpm, acc);
    recordKeyStats(sum.keys);
    logActivity(sum.ms / 1000, sum.correct + sum.errors);
    setResult({ stars, kpm, acc, sec: sum.ms / 1000, weak, first: stars > 0 && hadStarsBefore.current === 0 });
    hadStarsBefore.current = Math.max(hadStarsBefore.current, stars);
    if (stars > 0) sfx.fanfare(); else sfx.lose();
    setPhase('result');
  }, [total, lineIdx, lines.length, lesson]);

  const typing = useLineTyping({ text, round: round * 100 + lineIdx, active: phase === 'play', onDone, onMiss: () => sfx.miss() });

  // Space / Enter starts from the intro and result screens.
  useEffect(() => {
    if (phase === 'play' || !vocabReady) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (phase === 'intro') start(); else restart();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }); // re-bind every render: cheap, and always sees the current phase

  const next = LESSONS[index + 1];
  const label = lessonLabel(lesson, s, lang);

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-4xl animate-rise">
        <a href={href('typing')} className="mb-4 inline-flex items-center gap-1 font-bold text-ink-2 hover:text-ink"><ArrowLeft size={18} />{t('lesson.backToList')}</a>
        <div className="card p-6 text-center sm:p-8">
          <div className="text-sm font-bold text-muted">{t('lesson.lessonN', { n: lesson.id })}</div>
          <h1 className="mt-1 font-display text-3xl font-black sm:text-4xl">{label}</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-ink-2">{t(`lesson.intro.${lesson.kind}` as TKey)}</p>

          {lesson.newKeys.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {lesson.newKeys.map(k => {
                const tgt = keyFor(k, settings.layout);
                const f = tgt?.finger;
                return (
                  <div key={k} className="flex min-w-24 flex-col items-center rounded-2xl border-2 border-teal-line bg-teal-soft px-4 py-3">
                    <span className="font-display text-4xl font-black text-teal-ink">{k.toUpperCase()}</span>
                    {f && (
                      <span className="text-sm font-bold text-ink-2">
                        {f !== 'th' && t(['lp', 'lr', 'lm', 'li'].includes(f) ? 'hand.left' : 'hand.right')} {t(f === 'th' ? 'finger.th' : (`finger.${f.slice(1)}` as TKey))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {lesson.id === '1-1' && <p className="mx-auto mt-5 max-w-xl rounded-2xl bg-note p-4 font-semibold text-ink">{t('lesson.homeTip')}</p>}

          <div className="mt-6">
            <Keyboard layout={settings.layout} focus={lesson.newKeys} compact />
          </div>
          <div className="mt-6 flex flex-col items-center gap-2">
            <button className="btn btn-primary btn-lg" onClick={start} disabled={!vocabReady}>{t('lesson.start')}</button>
            <span className="text-sm text-muted">{t('lesson.spaceToStart')}</span>
          </div>
          <p className="mt-4 text-sm text-muted">{t('lesson.passRule', { acc: PASS_ACC, kpm: lesson.target })}</p>
        </div>
      </div>
    );
  }

  if (phase === 'result' && result) {
    const msg: TKey = result.stars === 3 ? 'result.perfect' : result.stars === 2 ? 'result.great' : result.stars === 1 ? 'result.pass' : 'result.retry';
    return (
      <div className="mx-auto max-w-2xl animate-rise">
        <div className="card p-6 text-center sm:p-8">
          <div className="text-sm font-bold text-muted">{t('lesson.lessonN', { n: lesson.id })} · {label}</div>
          <div className="my-4 flex justify-center animate-pop"><Stars n={result.stars} size={56} /></div>
          <h1 className="font-display text-3xl font-black">{t(msg)}</h1>
          {result.stars === 0 && <p className="mt-2 text-ink-2">{t('result.retryHint', { acc: PASS_ACC })}</p>}
          {result.first && next && <p className="mt-2 font-bold text-green-ink">{t('result.unlocked')}</p>}

          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label={t('stat.accuracy')} value={Math.round(result.acc)} unit="%" color={result.acc >= PASS_ACC ? 'green' : 'coral'} />
            <Stat label={t('stat.speed')} value={Math.round(result.kpm)} unit={t('stat.kpm')} color={result.kpm >= lesson.target ? 'green' : 'orange'} />
            <Stat label={t('stat.time')} value={Math.round(result.sec)} unit={t('stat.sec')} color="violet" />
          </div>
          <p className="mt-2 text-xs text-muted">{t('result.speedGoal', { kpm: lesson.target })}</p>

          {result.weak.length > 0 && (
            <div className="mt-6 rounded-2xl bg-coral-soft p-4">
              <div className="mb-2 text-sm font-bold text-coral-ink">{t('result.weakKeys')}</div>
              <div className="flex justify-center gap-2">
                {result.weak.map(k => <kbd key={k} className="min-w-10 rounded-lg border-2 border-coral-line bg-card px-2 py-1 font-display text-xl font-black">{k === ' ' ? '␣' : k}</kbd>)}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="btn" onClick={restart}><RotateCcw size={18} />{t('common.again')}</button>
            {result.stars > 0 && next && (
              <button className="btn btn-primary" onClick={() => navigate(`typing/${next.id}`)}>{t('common.next')}<ArrowRight size={18} /></button>
            )}
            {!next && result.stars > 0 && <a className="btn btn-orange" href={href('words')}>{t('result.goWords')}</a>}
            <a className="btn" href={href('typing')}>{t('lesson.backToList')}</a>
          </div>
          <p className="mt-3 text-sm text-muted">{t('lesson.spaceToRetry')}</p>
        </div>
      </div>
    );
  }

  // play
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center gap-3">
        <a href={href('typing')} className="btn btn-sm"><ArrowLeft size={16} />{t('common.quit')}</a>
        <div className="flex-1"><ProgressBar value={(charsBefore + typing.pos) / Math.max(1, charsTotal)} /></div>
        <span className="text-sm font-extrabold text-muted">{lineIdx + 1} / {lines.length}</span>
      </div>

      <div className="card px-4 py-8 sm:px-8">
        <TypingLine text={text} pos={typing.pos} missAt={typing.missAt} shakeKey={typing.shakeKey} />
      </div>

      <div className="my-4 min-h-4"><InputWarning warning={typing.warning} /></div>

      {settings.showKeyboard && <Keyboard layout={settings.layout} next={typing.expected} />}
      {settings.showHands && <div className="mt-3"><Hands next={typing.expected} layout={settings.layout} /></div>}
    </div>
  );
}
