import type { ReactNode } from 'react';
import { useT } from '../lib/i18n';
import type { Warning } from '../lib/typing';
import { say } from '../lib/audio';
import { Volume2 } from 'lucide-react';

export function Stars({ n, max = 3, size = 20 }: { n: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${n}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
            fill={i < n ? 'var(--orange)' : 'var(--tint)'}
            stroke={i < n ? '#C7801F' : 'var(--line-strong)'}
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

/** Friendly banner when the IME or Caps Lock is getting in the way. */
export function InputWarning({ warning }: { warning: Warning }) {
  const { t } = useT();
  if (!warning) return null;
  return (
    <div role="alert" className="mx-auto flex max-w-xl animate-pop items-center gap-3 rounded-2xl border-2 border-orange bg-orange-soft px-4 py-3 text-orange-ink">
      <span className="whitespace-nowrap text-2xl font-black" aria-hidden="true">{warning === 'ime' ? 'あ→A' : '⇪'}</span>
      <div className="text-left font-bold leading-snug">
        {t(warning === 'ime' ? 'warn.ime' : 'warn.caps')}
        <div className="text-sm font-medium">{t(warning === 'ime' ? 'warn.imeHow' : 'warn.capsHow')}</div>
      </div>
    </div>
  );
}

export function PageTitle({ icon, title, sub, right }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-black sm:text-3xl">
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </h1>
        {sub && <p className="mt-1 text-ink-2">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function SpeakButton({ text, file, size = 'md', label }: { text: string; file?: string; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const { p } = useT();
  const cls = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); say(text, file); (e.currentTarget as HTMLButtonElement).blur(); }}
      className={`inline-flex ${cls} shrink-0 items-center justify-center rounded-full border-2 border-teal-line bg-teal-soft text-teal-ink transition hover:bg-teal hover:text-on-fill`}
      aria-label={label ?? p('common.listen')}
      title={label ?? p('common.listen')}
    >
      <Volume2 size={size === 'lg' ? 26 : 20} />
    </button>
  );
}

export function ProgressBar({ value, color = 'teal' }: { value: number; color?: string }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-tint" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, value * 100)}%`, background: `var(--${color})` }} />
    </div>
  );
}

export function Stat({ label, value, unit, color = 'teal' }: { label: ReactNode; value: ReactNode; unit?: ReactNode; color?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3 text-center">
      <div className="text-sm font-bold text-muted">{label}</div>
      <div className="font-display text-3xl font-black" style={{ color: `var(--${color}-ink)` }}>
        {value}
        {unit && <span className="ml-1 text-base font-bold text-muted">{unit}</span>}
      </div>
    </div>
  );
}

/** A soft tinted pill; `color` is one of the Chotto hues. */
export function Pill({ children, color = 'teal' }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold"
      style={{ background: `var(--${color}-soft)`, color: `var(--${color}-ink)`, border: `1px solid var(--${color}-line)` }}>
      {children}
    </span>
  );
}
