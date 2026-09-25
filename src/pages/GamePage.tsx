import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Heart, Pause, Play, RotateCcw } from 'lucide-react';
import { GRADE_INFO, meaningOf, shuffle, useGrade, type Word } from '../lib/vocab';
import { progressStore, recordGameScore, logActivity, useProgress, useSettings, type GradeId } from '../lib/store';
import { readKey } from '../lib/typing';
import { say, sfx, stopVoice } from '../lib/audio';
import { useT } from '../lib/i18n';
import { Tx } from '../components/Tx';
import { href } from '../lib/router';
import { GradeTabs } from './WordsPage';
import { InputWarning, SpeakButton, Stat } from '../components/ui';

/*
  ことばバルーン — balloons carrying English words float up; type a word to pop
  its balloon before it flies away. Replaces the old laser/"Boss Jet" shooter:
  same typing practice, gentler theme, and the meaning is always on the balloon
  so the game teaches vocabulary instead of letter copying.

  The loop runs on requestAnimationFrame with real elapsed time, so speed is
  the same on 60 Hz and 120 Hz screens, and it moves balloons by writing
  transforms directly (no React render per frame).
*/

type Speed = 'slow' | 'normal' | 'fast';
type Source = 'learned' | 'all';
type Mode = 'easy' | 'memory';

const SPEEDS: Record<Speed, { cross: number; every: number; max: number }> = {
  slow:   { cross: 20, every: 3.4, max: 3 },
  normal: { cross: 14, every: 2.6, max: 4 },
  fast:   { cross: 9,  every: 1.9, max: 5 },
};
const ROUND_SEC = 90;
const HEARTS = 3;
const COLORS = ['teal', 'green', 'orange', 'coral', 'violet'];

interface Balloon { id: number; word: Word; x: number; y: number; typed: number; color: string; wobble: number }

function Opt<T extends string>({ value, cur, set, label, disabled }: { value: T; cur: T; set: (v: T) => void; label: ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={() => set(value)}
      disabled={disabled}
      aria-pressed={cur === value}
      className={`rounded-xl border-2 px-4 py-2 font-extrabold transition disabled:opacity-40 ${cur === value ? 'border-orange bg-orange-soft text-orange-ink' : 'border-line bg-card hover:bg-dim'}`}
    >
      {label}
    </button>
  );
}

export function GamePage() {
  const [settings, setSettings] = useSettings();
  const { t, lang } = useT();
  const progress = useProgress();
  const [grade, setGrade] = useState<GradeId>(settings.grade);
  const { words } = useGrade(grade);
  const [speed, setSpeed] = useState<Speed>('slow');
  const [mode, setMode] = useState<Mode>('easy');
  const [source, setSource] = useState<Source>('all');
  const [playing, setPlaying] = useState<null | { pool: Word[]; key: number }>(null);

  const learned = words?.filter(w => progress.words[w.id]) ?? [];
  const canLearned = learned.length >= 6;
  const src: Source = source === 'learned' && canLearned ? 'learned' : 'all';

  const start = () => {
    if (!words) return;
    const pool = src === 'learned' ? learned : words;
    setPlaying({ pool, key: Date.now() });
  };

  if (playing) {
    return (
      <GameRound
        key={playing.key}
        pool={playing.pool}
        speed={speed}
        mode={mode}
        scoreKey={`${grade}-${mode}-${speed}`}
        onExit={() => setPlaying(null)}
        onAgain={start}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <a href={href('')} className="mb-4 inline-flex items-center gap-1 font-bold text-ink-2 hover:text-ink"><ArrowLeft size={18} />{t('nav.home')}</a>
      <div className="card overflow-hidden">
        <div className="bg-orange-soft px-6 py-8 text-center">
          <div className="text-6xl" aria-hidden="true">🎈</div>
          <h1 className="mt-2 font-display text-3xl font-black">{t('game.title')}</h1>
          <p className="mx-auto mt-2 max-w-lg text-ink-2">{t('game.how')}</p>
        </div>
        <div className="space-y-5 p-6">
          <div>
            <div className="mb-2 font-black">{t('game.grade')}</div>
            <GradeTabs grade={grade} onPick={g => { setGrade(g); setSettings({ grade: g }); }} />
          </div>
          <div className="flex flex-wrap gap-6">
            <div>
              <div className="mb-2 font-black">{t('game.words')}</div>
              <div className="flex flex-wrap gap-2">
                <Opt value="all" cur={src} set={setSource} label={t('game.src.all')} />
                <Opt value="learned" cur={src} set={setSource} label={t('game.src.learned', { n: learned.length })} disabled={!canLearned} />
              </div>
            </div>
            <div>
              <div className="mb-2 font-black">{t('game.mode')}</div>
              <div className="flex flex-wrap gap-2">
                <Opt value="easy" cur={mode} set={setMode} label={t('game.mode.easy')} />
                <Opt value="memory" cur={mode} set={setMode} label={t('game.mode.memory')} />
              </div>
            </div>
            <div>
              <div className="mb-2 font-black">{t('game.speed')}</div>
              <div className="flex flex-wrap gap-2">
                <Opt value="slow" cur={speed} set={setSpeed} label={t('game.speed.slow')} />
                <Opt value="normal" cur={speed} set={setSpeed} label={t('game.speed.normal')} />
                <Opt value="fast" cur={speed} set={setSpeed} label={t('game.speed.fast')} />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted">{t(mode === 'easy' ? 'game.mode.easyHint' : 'game.mode.memoryHint')}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <span className="text-sm font-bold text-muted">
              {t('game.best')}: {progress.gameBest[`${grade}-${mode}-${speed}`] ?? 0} · <Tx text={GRADE_INFO[grade][lang]} />
            </span>
            <button className="btn btn-orange btn-lg" onClick={start} disabled={!words}>{t('game.start')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface GameState { balloons: Balloon[]; hearts: number; score: number; time: number; target: number | null; popped: Word[]; missed: Word[] }
const snapOf = (x: GameState) =>
  ({ balloons: x.balloons.map(b => ({ ...b })), hearts: x.hearts, score: x.score, time: x.time, target: x.target, popped: [...x.popped], missed: [...x.missed] });

interface RoundProps { pool: Word[]; speed: Speed; mode: Mode; scoreKey: string; onExit: () => void; onAgain: () => void }

function GameRound({ pool, speed, mode, scoreKey, onExit, onAgain }: RoundProps) {
  const { t, p } = useT();
  const [settings] = useSettings();
  const cfg = SPEEDS[speed];
  const [prevBest] = useState(() => progressStore.get().gameBest[scoreKey] ?? 0);
  const arenaRef = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<number, HTMLDivElement>());
  const g = useRef({
    balloons: [] as Balloon[],
    queue: shuffle(pool),
    nextId: 1,
    spawnIn: 0.4,
    time: ROUND_SEC,
    hearts: HEARTS,
    score: 0,
    combo: 0,
    target: null as number | null,
    popped: [] as Word[],
    missed: [] as Word[],
    keys: 0,
    running: true,
    over: false,
  });
  // React renders from a snapshot; the loop mutates g.current freely between frames.
  const snap = () => snapOf(g.current);

  const [view, setView] = useState({ balloons: [] as Balloon[], hearts: HEARTS, score: 0, time: ROUND_SEC, target: null as number | null, popped: [] as Word[], missed: [] as Word[] });
  const rerender = () => setView(snap());
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [warning, setWarning] = useState<'ime' | null>(null);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  const finish = useCallback(() => {
    const s = g.current;
    if (s.over) return;
    s.over = true;
    s.running = false;
    recordGameScore(scoreKey, s.score);
    logActivity(ROUND_SEC - s.time, s.keys, s.popped.length);
    sfx.fanfare();
    setView(snap());
    setOver(true);
  }, [scoreKey]);

  const nextWord = () => {
    const s = g.current;
    if (!s.queue.length) s.queue = shuffle(pool);
    // Avoid two balloons with the same first letter: typing would be ambiguous.
    const onScreen = new Set(s.balloons.map(b => b.word.w[0].toLowerCase()));
    const i = s.queue.findIndex(w => !onScreen.has(w.w[0].toLowerCase()));
    return s.queue.splice(i === -1 ? 0 : i, 1)[0];
  };

  // Game loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = g.current;
      const arena = arenaRef.current;
      if (s.running && arena) {
        const H = arena.clientHeight;
        const W = arena.clientWidth;
        const elapsed = ROUND_SEC - s.time;
        const pxPerSec = (H / cfg.cross) * (1 + Math.min(0.3, elapsed / 300));
        s.time -= dt;
        s.spawnIn -= dt;
        if (s.spawnIn <= 0 && s.balloons.length < cfg.max) {
          const lastX = s.balloons[s.balloons.length - 1]?.x ?? -1;
          let x = 0.05 + Math.random() * 0.62;
          if (Math.abs(x - lastX) < 0.22) x = (x + 0.35) % 0.67 + 0.05;
          s.balloons.push({ id: s.nextId++, word: nextWord(), x, y: H + 20, typed: 0, color: COLORS[s.nextId % COLORS.length], wobble: Math.random() * 6 });
          s.spawnIn = cfg.every;
          rerender();
        }
        let changed = false;
        for (const b of s.balloons) {
          b.y -= pxPerSec * dt;
          b.wobble += dt;
          const el = els.current.get(b.id);
          if (el) el.style.transform = `translate(${b.x * W + Math.sin(b.wobble * 1.6) * 8}px, ${b.y}px)`;
        }
        const gone = s.balloons.filter(b => b.y < -150);
        if (gone.length) {
          for (const b of gone) {
            s.missed.push(b.word);
            s.hearts--;
            if (s.target === b.id) s.target = null;
          }
          s.balloons = s.balloons.filter(b => b.y >= -150);
          s.combo = 0;
          sfx.lose();
          changed = true;
        }
        if (s.hearts <= 0 || s.time <= 0) { s.time = Math.max(0, s.time); finish(); changed = true; }
        if (changed) rerender();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [cfg, finish]); // eslint-disable-line react-hooks/exhaustive-deps

  // HUD timer display: refresh a few times a second.
  useEffect(() => {
    const id = setInterval(() => { if (g.current.running) setView(snapOf(g.current)); }, 250);
    return () => clearInterval(id);
  }, []);

  // Pause when the tab is hidden.
  useEffect(() => {
    const h = () => { if (document.hidden && !g.current.over) { g.current.running = false; setPaused(true); } };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);
  useEffect(() => () => stopVoice(), []);

  const togglePause = () => {
    const s = g.current;
    if (s.over) return;
    s.running = paused;
    setPaused(!paused);
  };

  // Typing
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const s = g.current;
      if (s.over) return;
      const k = readKey(e);
      if (k.kind === 'escape') { togglePause(); return; }
      if (!s.running) return;
      if (k.kind === 'ime') { setWarning('ime'); return; }
      if (k.kind === 'backspace') { e.preventDefault(); s.target = null; for (const b of s.balloons) b.typed = 0; rerender(); return; }
      if (k.kind !== 'char') return;
      e.preventDefault();
      setWarning(null);
      s.keys++;
      const ch = k.ch.toLowerCase();
      let b = s.balloons.find(x => x.id === s.target);
      if (!b) {
        // Lock onto the balloon closest to escaping whose word starts with this letter.
        b = s.balloons.filter(x => x.word.w[0].toLowerCase() === ch).sort((a, c) => a.y - c.y)[0];
        if (!b) { s.combo = 0; sfx.miss(); rerender(); return; }
        s.target = b.id;
      } else if (b.word.w[b.typed].toLowerCase() !== ch) {
        s.combo = 0;
        sfx.miss();
        rerender();
        return;
      }
      b.typed++;
      sfx.key();
      if (b.typed >= b.word.w.length) {
        s.combo++;
        s.score += b.word.w.length * 10 + Math.min(10, s.combo) * 5;
        s.popped.push(b.word);
        s.balloons = s.balloons.filter(x => x.id !== b!.id);
        s.target = null;
        sfx.pop();
        say(b.word.w, b.word.a);
        const W = arenaRef.current?.clientWidth ?? 600;
        const burst = { id: b.id, x: b.x * W, y: b.y, text: meaningOf(b.word, settings.meaningLang) };
        setBursts(list => [...list, burst]);
        setTimeout(() => setBursts(list => list.filter(x => x.id !== burst.id)), 1400);
      }
      rerender();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const s = view;

  if (over) {
    const best = s.score > prevBest;
    return (
      <div className="mx-auto max-w-2xl animate-rise">
        <div className="card p-6 text-center sm:p-8">
          <div className="text-6xl" aria-hidden="true">{s.hearts > 0 ? '🎉' : '🎈'}</div>
          <h1 className="mt-2 font-display text-3xl font-black">{t(s.hearts > 0 ? 'game.clear' : 'game.over')}</h1>
          {best && <p className="mt-1 font-bold text-orange-ink">{t('game.newBest')}</p>}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label={t('game.score')} value={s.score} color="orange" />
            <Stat label={t('game.popped')} value={s.popped.length} color="green" />
            <Stat label={t('game.missed')} value={s.missed.length} color="coral" />
          </div>
          {s.missed.length > 0 && (
            <div className="mt-6 text-left">
              <div className="mb-2 font-black">{t('game.reviewThese')}</div>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {[...new Map(s.missed.map(w => [w.id, w])).values()].map(w => (
                  <li key={w.id} className="flex items-center gap-3 px-4 py-2">
                    <span className="font-black">{w.w}</span>
                    <span className="flex-1 truncate text-ink-2">{meaningOf(w, settings.meaningLang)}</span>
                    <SpeakButton text={w.w} file={w.a} size="sm" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="btn btn-orange" onClick={onAgain}><RotateCcw size={18} />{t('common.again')}</button>
            <button className="btn" onClick={onExit}>{t('game.settings')}</button>
            <a className="btn" href={href('words')}>{t('nav.words')}</a>
          </div>
        </div>
      </div>
    );
  }

  const target = s.balloons.find(b => b.id === s.target);
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button className="btn btn-sm" onClick={() => { g.current.running = false; g.current.over = true; onExit(); }}><ArrowLeft size={16} />{t('common.quit')}</button>
        <button className="btn btn-sm" onClick={togglePause} aria-label={p('game.pause')}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        <div className="flex items-center gap-1" aria-label={`${s.hearts}/${HEARTS}`}>
          {Array.from({ length: HEARTS }, (_, i) => <Heart key={i} size={24} fill={i < s.hearts ? 'var(--coral)' : 'transparent'} stroke={i < s.hearts ? 'var(--coral)' : 'var(--line-strong)'} />)}
        </div>
        <div className="ml-auto flex items-center gap-4 font-display font-black">
          <span className="text-orange-ink">{s.score}</span>
          <span className="tabular-nums text-ink-2">⏱ {Math.ceil(s.time)}</span>
        </div>
      </div>

      <div
        ref={arenaRef}
        className="relative h-[62vh] min-h-[380px] overflow-hidden rounded-3xl border border-line"
        style={{ background: 'linear-gradient(180deg, var(--teal-soft) 0%, var(--canvas) 75%, var(--green-soft) 100%)' }}
      >
        {/* clouds */}
        <div className="pointer-events-none absolute left-[8%] top-[10%] text-5xl opacity-60" aria-hidden="true">☁️</div>
        <div className="pointer-events-none absolute right-[12%] top-[26%] text-4xl opacity-50" aria-hidden="true">☁️</div>

        {s.balloons.map(b => {
          const w = b.word.w;
          const locked = b.id === s.target;
          return (
            <div
              key={b.id}
              ref={el => { if (el) els.current.set(b.id, el); else els.current.delete(b.id); }}
              className="absolute left-0 top-0 flex flex-col items-center will-change-transform"
              style={{ transform: `translate(-999px, -999px)`, zIndex: locked ? 5 : 1 }}
            >
              <div
                className="flex min-w-28 max-w-60 flex-col items-center rounded-[50%_50%_46%_46%/55%_55%_45%_45%] px-5 pb-6 pt-5 text-center shadow-card"
                style={{ background: `var(--${b.color})`, outline: locked ? '4px solid var(--ink)' : undefined }}
              >
                <span className="max-w-full truncate text-sm font-bold text-on-fill opacity-90">{meaningOf(b.word, settings.meaningLang)}</span>
                <span className="whitespace-nowrap font-type text-2xl font-black tracking-wide">
                  <span className="text-on-fill opacity-40">{w.slice(0, b.typed)}</span>
                  <span className="text-on-fill">{mode === 'easy' || b.typed > 0 ? w.slice(b.typed) : w[0] + w.slice(1).replace(/[^ ]/g, '_')}</span>
                </span>
              </div>
              <svg width="12" height="46" viewBox="0 0 12 46" aria-hidden="true"><path d="M6 0 C 0 12, 12 22, 6 34 S 6 44, 6 46" stroke="var(--line-strong)" strokeWidth="2" fill="none" /></svg>
            </div>
          );
        })}

        {bursts.map(b => (
          <div key={b.id} className="pointer-events-none absolute left-0 top-0 animate-pop text-center" style={{ transform: `translate(${b.x}px, ${Math.max(10, b.y)}px)` }}>
            <div className="text-4xl" aria-hidden="true">✨</div>
            <div className="rounded-xl bg-card px-3 py-1 font-black text-green-ink shadow-card">{b.text}</div>
          </div>
        ))}

        {paused && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-canvas/80 backdrop-blur-sm">
            <div className="font-display text-3xl font-black">{t('game.paused')}</div>
            <button className="btn btn-primary btn-lg" onClick={togglePause}><Play size={20} />{t('game.resume')}</button>
          </div>
        )}
      </div>

      <div className="mt-3 flex min-h-12 items-center justify-center gap-3">
        {target ? (
          <span className="font-type text-2xl font-black"><span className="text-green-ink">{target.word.w.slice(0, target.typed)}</span><span className="text-muted">{mode === 'easy' ? target.word.w.slice(target.typed) : ''}</span></span>
        ) : (
          <span className="text-sm text-muted">{t('game.hint')}</span>
        )}
      </div>
      <InputWarning warning={warning} />
    </div>
  );
}
