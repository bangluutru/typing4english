import { FINGER_COLOR, keyFor, LAYOUTS, type Finger } from '../lib/keyboard';
import type { KeyboardLayoutId } from '../lib/store';

interface Props {
  layout: KeyboardLayoutId;
  /** Next character to type: its key (and Shift) light up. */
  next?: string;
  /** Characters introduced in this lesson get a soft ring. */
  focus?: string[];
  /** 0..1 miss rate per character, for the progress heat map. */
  heat?: Record<string, number>;
  compact?: boolean;
}

/** Widest row in key units (Σ w), per layout. */
const ROW_UNITS = Object.fromEntries(
  Object.entries(LAYOUTS).map(([id, rows]) => [id, Math.max(...rows.map(r => r.reduce((n, k) => n + (k.w ?? 1), 0)))]),
) as Record<KeyboardLayoutId, number>;

/**
 * On-screen keyboard. Keys are tinted by finger so children learn which finger
 * owns which key; the next key is filled with its finger colour.
 *
 * Sized from its own width, not the window's: the wrapper is a CSS container
 * and one key unit is whatever lets the widest row fill it exactly. A row of
 * U units with gap g is (u + g)·U − g wide, so u = (W + g) / U − g, where W is
 * 100cqw minus the frame (2 × 12px padding + 2px border). Capped at the old
 * desktop sizes. The earlier vw-based size with a 22px floor overflowed any
 * container narrower than the window (a lesson card on a phone cut the
 * keyboard off after P).
 *
 * Keys may be taller than wide on phones (min height) so letters stay legible.
 */
export function Keyboard({ layout, next, focus = [], heat, compact }: Props) {
  const target = next !== undefined ? keyFor(next, layout) : undefined;
  const focusCodes = new Set(focus.map(c => keyFor(c, layout)?.code).filter(Boolean));
  const U = ROW_UNITS[layout];
  const unit = `min(${compact ? 36 : 46}px, calc((100cqw - 26px + var(--g)) / ${U} - var(--g)))`;

  return (
    <div className="@container w-full [--g:3px] sm:[--g:5px]" aria-hidden="true">
      <div className="mx-auto flex w-max flex-col gap-[var(--g)] rounded-2xl border border-line bg-dim p-2 sm:p-3" style={{ ['--u' as string]: unit }}>
        {LAYOUTS[layout].map((row, ri) => (
          <div key={ri} className={`flex gap-[var(--g)] ${ri === 4 ? 'justify-center' : ''}`}>
            {row.map(k => {
              const isTarget = target?.code === k.code;
              const isShift = target?.shift === k.code;
              const c = FINGER_COLOR[k.finger as Finger];
              const lit = isTarget || isShift;
              const h = heat && k.base ? heat[k.base] : undefined;
              const width = `calc(var(--u) * ${k.w ?? 1} + var(--g) * ${(k.w ?? 1) - 1})`;
              const bg = lit ? c.fill : h !== undefined ? `color-mix(in srgb, var(--coral) ${Math.round(h * 100)}%, var(--card))` : 'var(--card)';
              return (
                <div
                  key={k.code}
                  className={`relative flex items-center justify-center overflow-hidden whitespace-nowrap rounded-md font-extrabold sm:rounded-lg transition-colors duration-100 ${lit ? 'text-on-fill scale-105 z-10' : 'text-ink-2'} ${focusCodes.has(k.code) && !lit ? 'ring-2 ring-offset-1 ring-offset-dim' : ''}`}
                  style={{
                    width,
                    height: 'max(var(--u), 24px)',
                    background: bg,
                    borderBottom: `4px solid ${lit ? 'rgba(0,0,0,0.18)' : c.fill}`,
                    boxShadow: lit ? `0 0 0 3px ${c.fill}55` : undefined,
                    ['--tw-ring-color' as string]: c.fill,
                    fontSize: k.label && k.label.length > 2 ? 'max(calc(var(--u) * 0.26), 7px)' : 'max(calc(var(--u) * 0.4), 10px)',
                  }}
                >
                  {k.label !== undefined ? k.label : (
                    <span className="flex flex-col items-center leading-none">
                      {k.shift && !/[A-Z]/.test(k.shift) && <span className="text-[0.6em] opacity-60 @max-[480px]:hidden">{k.shift}</span>}
                      <span>{k.base && /[a-z]/.test(k.base) ? k.base.toUpperCase() : k.base}</span>
                    </span>
                  )}
                  {k.home && <span className="absolute bottom-[3px] h-[3px] w-[30%] rounded bg-current opacity-50" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
