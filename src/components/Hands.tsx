import { FINGER_COLOR, keyFor, LEFT_FINGERS, type Finger } from '../lib/keyboard';
import type { KeyboardLayoutId } from '../lib/store';
import { useT } from '../lib/i18n';

/* Finger geometry for one (left) hand; the right hand is mirrored. */
const FINGERS: { f: 'p' | 'r' | 'm' | 'i' | 't'; x: number; y: number; h: number; rot: number }[] = [
  { f: 'p', x: 8, y: 34, h: 44, rot: -8 },
  { f: 'r', x: 32, y: 16, h: 60, rot: -3 },
  { f: 'm', x: 56, y: 8, h: 68, rot: 0 },
  { f: 'i', x: 80, y: 16, h: 60, rot: 4 },
  { f: 't', x: 108, y: 66, h: 40, rot: 48 },
];

function Hand({ side, active }: { side: 'l' | 'r'; active: Set<Finger> }) {
  return (
    <svg viewBox="0 0 140 150" className="h-full w-auto" style={side === 'r' ? { transform: 'scaleX(-1)' } : undefined}>
      <rect x="10" y="70" width="100" height="72" rx="30" fill="var(--tint)" stroke="var(--line-strong)" strokeWidth="2" />
      {FINGERS.map(({ f, x, y, h, rot }) => {
        const id = (f === 't' ? 'th' : `${side}${f}`) as Finger;
        const on = active.has(id);
        const col = FINGER_COLOR[id];
        return (
          <g key={f} transform={`rotate(${rot} ${x + 11} ${y + h})`}>
            <rect
              x={x}
              y={y}
              width="22"
              height={h + 14}
              rx="11"
              fill={on ? col.fill : 'var(--card)'}
              stroke={on ? col.fill : 'var(--line-strong)'}
              strokeWidth="2"
            />
            {on && <circle cx={x + 11} cy={y + 11} r="5" fill="#fff" opacity="0.85" />}
          </g>
        );
      })}
    </svg>
  );
}

/** Two hands; the finger for the next key (and the Shift finger) light up. */
export function Hands({ next, layout }: { next?: string; layout: KeyboardLayoutId }) {
  const { t } = useT();
  const target = next !== undefined ? keyFor(next, layout) : undefined;
  const active = new Set<Finger>();
  if (target) {
    active.add(target.finger);
    if (target.shift) active.add(target.shift === 'ShiftLeft' ? 'lp' : 'rp');
  }
  const f = target?.finger;
  const hand = f === 'th' ? null : f && LEFT_FINGERS.includes(f) ? 'left' : 'right';
  const fingerKey = f === 'th' ? 'finger.th' : f ? (`finger.${f.slice(1)}` as const) : null;

  return (
    <div className="flex items-end justify-center gap-4" aria-live="polite">
      <div className="h-20 sm:h-24"><Hand side="l" active={active} /></div>
      <div className="min-w-[9rem] pb-2 text-center text-sm font-bold text-ink-2">
        {fingerKey && (
          <>
            {hand && <span>{t(hand === 'left' ? 'hand.left' : 'hand.right')} </span>}
            <span>{t(fingerKey as 'finger.th')}</span>
            {target?.shift && <div className="text-xs text-muted">+ {t(target.shift === 'ShiftLeft' ? 'shift.left' : 'shift.right')}</div>}
          </>
        )}
      </div>
      <div className="h-20 sm:h-24"><Hand side="r" active={active} /></div>
    </div>
  );
}
