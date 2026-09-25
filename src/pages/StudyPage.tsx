import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Gamepad2, RotateCcw, X } from 'lucide-react';
import { exampleMeaningOf, meaningOf, shuffle, topicName, topicSets, useGrade, TOPICS, type Word } from '../lib/vocab';
import { logActivity, recordKeyStats, reviewWord, useProgress, useSettings, type GradeId } from '../lib/store';
import { useLineTyping, type LineStats } from '../lib/typing';
import { say, sfx, stopVoice } from '../lib/audio';
import { useT } from '../lib/i18n';
import { Tx } from '../components/Tx';
import { href, navigate } from '../lib/router';
import { Keyboard } from '../components/Keyboard';
import { TypingLine } from '../components/TypingLine';
import { InputWarning, Pill, ProgressBar, SpeakButton } from '../components/ui';
import { dueWords } from '../lib/learning';

/*
  One study set, three steps:
    1. みる・きく・うつ  — see the word, hear it, type it while looking.
    2. 思い出してうつ     — see the meaning, hear it, type it from memory.
    3. けっか             — results feed the spaced-repetition boxes.
  Review mode (set = "review") skips step 1 and uses due words.
*/

type Phase = 'learn' | 'recall' | 'result';
const REVIEW_MAX = 12;

export function StudyPage({ grade, topic, set }: { grade: GradeId; topic?: string; set?: string }) {
  const { words, error } = useGrade(grade);
  const progress = useProgress();
  const { t } = useT();
  const review = topic === 'review';

  // Pick the words once per visit; progress changes during study must not reshuffle.
  const items = useMemo(() => {
    if (!words) return null;
    if (review) return dueWords(words, progress).sort((a, b) => progress.words[a.id].due - progress.words[b.id].due).slice(0, REVIEW_MAX);
    return topicSets(words, topic ?? '')[Number(set)] ?? [];
  }, [words, review, topic, set]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="card p-6 text-center font-bold">{t('common.loadError')}</p>;
  if (!items) return <p className="py-12 text-center text-muted">{t('common.loading')}</p>;
  if (!items.length) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mb-2 text-4xl">🎉</div>
        <p className="mb-4 font-bold">{t(review ? 'study.noReview' : 'common.loadError')}</p>
        <a className="btn btn-primary" href={href(`words/${grade}`)}>{t('words.allTopics')}</a>
      </div>
    );
  }
  return <StudyRunner key={`${grade}/${topic}/${set}`} grade={grade} topic={topic ?? ''} setIndex={Number(set)} items={items} review={review} />;
}

interface Answer { word: Word; ok: boolean }
type Step = { key: string; done: boolean; gaveUp: boolean; revealed: Set<number> };
const fresh = (key: string): Step => ({ key, done: false, gaveUp: false, revealed: new Set([0]) });

function StudyRunner({ grade, topic, setIndex, items, review }: { grade: GradeId; topic: string; setIndex: number; items: Word[]; review: boolean }) {
  const { t, lang } = useT();
  const [settings] = useSettings();
  const [phase, setPhase] = useState<Phase>(review ? 'recall' : 'learn');
  const [order, setOrder] = useState<Word[]>(() => (review ? shuffle(items) : items));
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [attempt, setAttempt] = useState(0);
  const missPerPos = useRef<Record<number, number>>({});
  const started = useRef(0);
  const keyCount = useRef(0);
  useEffect(() => { started.current = performance.now(); }, []);

  const word = order[i];
  const recall = phase === 'recall';

  // Per-word state, keyed by the step so it starts fresh for every word.
  const stepKey = `${phase}|${i}|${attempt}`;
  const [stepState, setStepState] = useState<Step>(() => fresh(stepKey));
  const step = stepState.key === stepKey ? stepState : fresh(stepKey);
  const { done, gaveUp, revealed } = step;
  const patchStep = useCallback((f: (s: Step) => Partial<Step>) => {
    setStepState(prev => {
      const base = prev.key === stepKey ? prev : fresh(stepKey);
      return { ...base, ...f(base) };
    });
  }, [stepKey]);

  // New word on screen: play the pronunciation.
  useEffect(() => {
    if (phase === 'result' || !word) return;
    missPerPos.current = {};
    const tm = setTimeout(() => say(word.w, word.a), 250);
    return () => clearTimeout(tm);
  }, [word, phase, attempt]);

  useEffect(() => () => stopVoice(), []);

  const posRef = useRef(0);
  const onDone = useCallback((st: LineStats) => {
    keyCount.current += st.correct + st.errors;
    recordKeyStats(st.keys);
    sfx.word();
    patchStep(() => ({ done: true }));
    if (recall) {
      const hints = revealed.size - 1; // first letter is free
      const ok = !gaveUp && hints === 0 && st.errors <= 1;
      setAnswers(a => [...a, { word, ok }]);
      reviewWord(word.id, ok);
      say(word.w, word.a);
    }
  }, [recall, revealed, gaveUp, word, patchStep]);

  const onMiss = useCallback(() => {
    if (!recall) return;
    const p = posRef.current;
    const n = (missPerPos.current[p] ?? 0) + 1;
    missPerPos.current[p] = n;
    if (n >= 2) patchStep(st => ({ revealed: new Set(st.revealed).add(p) })); // two misses on a letter: show it
  }, [recall, patchStep]);

  const typing = useLineTyping({ text: word?.w ?? '', round: i * 10 + attempt + (recall ? 1000 : 0), active: phase !== 'result' && !done, onDone, onMiss });
  useEffect(() => { posRef.current = typing.pos; }, [typing.pos]);

  const advance = useCallback(() => {
    if (i + 1 < order.length) { setI(i + 1); return; }
    if (phase === 'learn') {
      setOrder(shuffle(items));
      setI(0);
      setPhase('recall');
      return;
    }
    logActivity((performance.now() - started.current) / 1000, keyCount.current, order.length);
    sfx.fanfare();
    setPhase('result');
  }, [i, order.length, phase, items]);

  // Enter / Space moves on once the word is typed.
  useEffect(() => {
    if (!done) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [done, advance]);

  const giveUp = () => {
    patchStep(() => ({ gaveUp: true, revealed: new Set(word.w.split('').map((_, k) => k)) }));
    (document.activeElement as HTMLElement | null)?.blur();
  };

  const restart = () => {
    setAnswers([]);
    setOrder(review ? shuffle(items) : items);
    setI(0);
    setPhase(review ? 'recall' : 'learn');
    setAttempt(a => a + 1);
    started.current = performance.now();
    keyCount.current = 0;
  };

  const back = review ? href(`words/${grade}`) : href(`words/${grade}/${topic}`);

  if (phase === 'result') {
    const okN = answers.filter(a => a.ok).length;
    const nextSet = !review ? `study/${grade}/${topic}/${setIndex + 1}` : null;
    return (
      <div className="mx-auto max-w-2xl animate-rise">
        <div className="card p-6 text-center sm:p-8">
          <div className="text-5xl" aria-hidden="true">{okN === answers.length ? '🏆' : okN >= answers.length / 2 ? '🌟' : '🌱'}</div>
          <h1 className="mt-2 font-display text-3xl font-black">{t(okN === answers.length ? 'study.allRight' : 'study.done')}</h1>
          <p className="mt-1 text-lg text-ink-2">{t('study.score', { ok: okN, n: answers.length })}</p>
          <ul className="mt-6 divide-y divide-line rounded-2xl border border-line text-left">
            {answers.map(({ word: w, ok }) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-green-soft text-green-ink' : 'bg-coral-soft text-coral-ink'}`}>{ok ? <Check size={16} /> : <X size={16} />}</span>
                <span className="font-black">{w.w}</span>
                <span className="flex-1 truncate text-ink-2">{meaningOf(w, settings.meaningLang)}</span>
                <SpeakButton text={w.w} file={w.a} size="sm" />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">{t('study.srsNote')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="btn" onClick={restart}><RotateCcw size={18} />{t('common.again')}</button>
            {nextSet && <button className="btn btn-primary" onClick={() => navigate(nextSet)}>{t('study.nextSet')}<ArrowRight size={18} /></button>}
            <a className="btn btn-orange" href={href('game')}><Gamepad2 size={18} />{t('study.playGame')}</a>
            <a className="btn" href={back}>{t('words.allTopics')}</a>
          </div>
        </div>
      </div>
    );
  }

  const stepLabel = recall ? t('study.step2') : t('study.step1');
  const exMeaning = exampleMeaningOf(word, settings.meaningLang);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <a href={back} className="btn btn-sm"><ArrowLeft size={16} />{t('common.quit')}</a>
        <div className="flex-1"><ProgressBar value={(i + (done ? 1 : 0)) / order.length} color={recall ? 'violet' : 'green'} /></div>
        <span className="text-sm font-extrabold text-muted">{i + 1} / {order.length}</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        {!review && <Pill color={recall ? 'teal' : 'green'}>{t('study.stepN', { n: recall ? 2 : 1 })}</Pill>}
        <span className="font-black">{stepLabel}</span>
        {TOPICS[word.t] && <Pill color="violet">{TOPICS[word.t].icon} <Tx text={topicName(word.t, lang)} /></Pill>}
      </div>

      <div className="card relative p-6 text-center sm:p-8" key={`${phase}-${i}`}>
        {/* meaning first when recalling */}
        {recall && <div className="mb-4 font-display text-3xl font-black text-ink sm:text-4xl">{meaningOf(word, settings.meaningLang)}</div>}

        <div className="flex items-center justify-center gap-3">
          <TypingLine
            text={word.w}
            pos={typing.pos}
            missAt={typing.missAt}
            shakeKey={typing.shakeKey}
            hidden={recall}
            revealed={revealed}
            size="xl"
          />
          <SpeakButton text={word.w} file={word.a} size="lg" />
        </div>
        {(!recall || done) && word.ipa && <div className="mt-1 text-muted">/{word.ipa}/</div>}

        {!recall && <div className="mt-4 text-2xl font-black text-ink-2">{meaningOf(word, settings.meaningLang)}</div>}

        {(!recall || done) && word.ex && (
          <div className="mx-auto mt-5 max-w-xl rounded-2xl bg-dim p-4 text-left">
            <div className="flex items-start gap-2">
              <p className="flex-1 font-bold">{word.ex}</p>
              {word.ea && <SpeakButton text={word.ex} file={word.ea} size="sm" />}
            </div>
            {exMeaning && <p className="mt-1 text-sm text-ink-2">{exMeaning}</p>}
          </div>
        )}

        {done ? (
          <div className="mt-6 flex flex-col items-center gap-2 animate-pop">
            {recall && (
              <span className={`font-black ${answers[answers.length - 1]?.ok ? 'text-green-ink' : 'text-orange-ink'}`}>
                {answers[answers.length - 1]?.ok ? t('study.correct') : t('study.almost')}
              </span>
            )}
            <button className="btn btn-primary" onClick={e => { e.currentTarget.blur(); advance(); }}>{t('common.next')}<ArrowRight size={18} /></button>
            <span className="text-xs text-muted">{t('study.enterNext')}</span>
          </div>
        ) : (
          <div className="mt-6 text-sm text-muted">
            {recall ? (
              <button className="font-bold underline hover:text-ink" onClick={giveUp} disabled={gaveUp}>{t('study.giveUp')}</button>
            ) : t('study.typeIt')}
          </div>
        )}
      </div>

      <div className="my-3 min-h-4"><InputWarning warning={typing.warning} /></div>
      {settings.showKeyboard && !done && <Keyboard layout={settings.layout} next={recall && !revealed.has(typing.pos) ? undefined : typing.expected} compact />}
    </div>
  );
}
