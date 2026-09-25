import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyStat } from './store';

/* --------------------------------------------------------------------------
   Keyboard input shared by lessons, word study and the game.

   Children in Japan very often have the IME in かな/ローマ字 mode. The browser
   then reports key "Process" (or isComposing) and no character reaches us, so
   every press used to count as a mistake. We detect that and ask the child to
   switch to 半角英数 instead of scoring anything.
   -------------------------------------------------------------------------- */

export type TypedKey =
  | { kind: 'char'; ch: string; caps: boolean }
  | { kind: 'ime' }
  | { kind: 'escape' }
  | { kind: 'backspace' }
  | { kind: 'ignore' };

const FULL_WIDTH = /[\uFF01-\uFF5E\u3000-\u30FF]/;

export function readKey(e: KeyboardEvent): TypedKey {
  if (e.isComposing || e.key === 'Process' || e.keyCode === 229) return { kind: 'ime' };
  if (e.ctrlKey || e.metaKey || e.altKey) return { kind: 'ignore' };
  if (e.key === 'Escape') return { kind: 'escape' };
  if (e.key === 'Backspace') return { kind: 'backspace' };
  if (e.repeat) return { kind: 'ignore' };
  if (e.key.length !== 1) return { kind: 'ignore' }; // Shift, Tab, arrows, 変換, Dead...
  if (FULL_WIDTH.test(e.key)) return { kind: 'ime' };
  let caps = false;
  try { caps = e.getModifierState('CapsLock'); } catch { /* old browsers */ }
  return { kind: 'char', ch: e.key, caps };
}

/** Should the page swallow this key so Space doesn't scroll and "/" doesn't open find? */
export const shouldPrevent = (e: KeyboardEvent) =>
  !e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === 'Backspace' || e.key === "'" || e.key === '/');

export interface LineStats {
  correct: number;
  errors: number;
  ms: number;
  keys: Record<string, KeyStat>;
}

/** Keys per minute and accuracy (%) from accumulated stats. */
export const kpmOf = (s: Pick<LineStats, 'correct' | 'ms'>) => (s.ms > 0 ? (s.correct / s.ms) * 60000 : 0);
export const accOf = (s: Pick<LineStats, 'correct' | 'errors'>) =>
  s.correct + s.errors > 0 ? (s.correct / (s.correct + s.errors)) * 100 : 100;

export function mergeStats(a: LineStats, b: LineStats): LineStats {
  const keys = { ...a.keys };
  for (const [k, v] of Object.entries(b.keys)) {
    const p = keys[k] ?? { hit: 0, miss: 0 };
    keys[k] = { hit: p.hit + v.hit, miss: p.miss + v.miss };
  }
  return { correct: a.correct + b.correct, errors: a.errors + b.errors, ms: a.ms + b.ms, keys };
}
export const emptyStats = (): LineStats => ({ correct: 0, errors: 0, ms: 0, keys: {} });

export type Warning = 'ime' | 'caps' | null;

interface Options {
  text: string;
  /** Change to restart even when the same text comes round again. */
  round?: number;
  active: boolean;
  onDone: (stats: LineStats) => void;
  onMiss?: (expected: string) => void;
  onHit?: (ch: string) => void;
}

/**
 * Type one line exactly. A wrong key does not advance the cursor (the child
 * must find the right key), so Backspace is never needed and accuracy cannot
 * be inflated by retyping characters that were already correct.
 */
export function useLineTyping({ text, round = 0, active, onDone, onMiss, onHit }: Options) {
  // Everything resets when the line (or round) changes: state is keyed by `line`.
  const line = `${round}|${text}`;
  const [view, setView] = useState({ line, pos: 0, missAt: new Set<number>(), shake: 0 });
  const [warning, setWarning] = useState<Warning>(null);
  const r = useRef({ line: '', pos: 0, start: 0, correct: 0, errors: 0, keys: {} as Record<string, KeyStat>, done: false });
  const cb = useRef({ onDone, onMiss, onHit });
  useEffect(() => { cb.current = { onDone, onMiss, onHit }; });

  const cur = view.line === line ? view : { line, pos: 0, missAt: new Set<number>(), shake: 0 };

  const handle = useCallback((e: KeyboardEvent) => {
    if (r.current.line !== line) {
      r.current = { line, pos: 0, start: 0, correct: 0, errors: 0, keys: {}, done: false };
    }
    const s = r.current;
    if (s.done) return;
    const k = readKey(e);
    if (k.kind === 'ime') { setWarning('ime'); return; }
    if (k.kind !== 'char') return;
    if (shouldPrevent(e)) e.preventDefault();
    const expected = text[s.pos];
    if (!s.start) s.start = performance.now();
    const stat = (s.keys[expected] ??= { hit: 0, miss: 0 });
    if (k.ch === expected) {
      setWarning(null);
      s.correct++;
      stat.hit++;
      s.pos++;
      const pos = s.pos;
      setView(v => ({ ...(v.line === line ? v : { line, missAt: new Set<number>(), shake: 0 }), pos }));
      cb.current.onHit?.(k.ch);
      if (s.pos >= text.length) {
        s.done = true;
        cb.current.onDone({ correct: s.correct, errors: s.errors, ms: performance.now() - s.start, keys: s.keys });
      }
    } else {
      // Wrong case with Caps Lock on is the Caps Lock's fault: say so.
      if (k.caps && k.ch.toLowerCase() === expected.toLowerCase()) setWarning('caps');
      s.errors++;
      stat.miss++;
      const pos = s.pos;
      setView(v => {
        const base = v.line === line ? v : { line, pos: 0, missAt: new Set<number>(), shake: 0 };
        return { ...base, missAt: new Set(base.missAt).add(pos), shake: base.shake + 1 };
      });
      cb.current.onMiss?.(expected);
    }
  }, [text, line]);

  useEffect(() => {
    if (!active) return;
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [active, handle]);

  return { pos: cur.pos, missAt: cur.missAt, shakeKey: cur.shake, warning, expected: text[cur.pos] as string | undefined };
}
