interface Props {
  text: string;
  pos: number;
  missAt: Set<number>;
  shakeKey: number;
  /** Hide the letters that are not typed yet (spelling from memory). */
  hidden?: boolean;
  /** Positions revealed as hints while `hidden`. */
  revealed?: Set<number>;
  size?: 'lg' | 'xl';
}

/** One line of text to type, with a big friendly cursor. */
export function TypingLine({ text, pos, missAt, shakeKey, hidden, revealed, size = 'lg' }: Props) {
  const fs = size === 'xl' ? 'clamp(30px, 6vw, 56px)' : 'clamp(24px, 4.2vw, 40px)';
  return (
    <div
      key={shakeKey}
      className={`flex flex-wrap justify-center font-type font-extrabold tracking-wide ${shakeKey ? 'animate-shake' : ''}`}
      style={{ fontSize: fs, lineHeight: 1.5 }}
      aria-label={hidden ? undefined : text}
    >
      {[...text].map((ch, i) => {
        const done = i < pos;
        const cur = i === pos;
        const miss = missAt.has(i);
        const show = !hidden || done || revealed?.has(i) || ch === ' ';
        let color = 'var(--muted)';
        if (done) color = miss ? 'var(--coral-ink)' : 'var(--green-ink)';
        else if (cur) color = 'var(--ink)';
        return (
          <span
            key={i}
            className="relative inline-flex min-w-[0.62em] justify-center rounded-md"
            style={{
              color,
              background: cur ? (miss ? 'var(--coral-soft)' : 'var(--teal-soft)') : undefined,
              opacity: !done && !cur ? 0.75 : 1,
            }}
          >
            {ch === ' ' ? (cur ? <span className="opacity-50">␣</span> : ' ') : show ? ch : <span className="opacity-40">_</span>}
            {cur && <span className="absolute -bottom-0.5 left-1 right-1 h-1 rounded-full" style={{ background: miss ? 'var(--coral)' : 'var(--teal)' }} />}
          </span>
        );
      })}
    </div>
  );
}
