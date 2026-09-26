import { useState } from 'react';
import { LESSONS } from '../lib/curriculum';
import { GRADES, GRADE_INFO, gradeName, useVocabIndex } from '../lib/vocab';
import { MASTERED_BOX, dayKey, streakDays, useProgress, useSettings } from '../lib/store';
import { useT } from '../lib/i18n';
import { Tx } from '../components/Tx';
import { Keyboard } from '../components/Keyboard';
import { PageTitle, ProgressBar, Stat, Stars } from '../components/ui';

function last14(days: Record<string, { sec: number }>) {
  const out: { key: string; label: string; min: number }[] = [];
  const d = new Date();
  d.setDate(d.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    const k = dayKey(d);
    out.push({ key: k, label: `${d.getMonth() + 1}/${d.getDate()}`, min: Math.round((days[k]?.sec ?? 0) / 60) });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function ProgressPage() {
  const { t, lang } = useT();
  const [settings] = useSettings();
  const p = useProgress();
  const index = useVocabIndex();
  const [hover, setHover] = useState<number | null>(null);

  const totalSec = Object.values(p.days).reduce((n, d) => n + d.sec, 0);
  const totalKeys = Object.values(p.days).reduce((n, d) => n + d.keys, 0);
  const stars = LESSONS.reduce((n, l) => n + (p.lessons[l.id]?.stars ?? 0), 0);
  const bestKpm = Math.max(0, ...Object.values(p.lessons).map(l => l.bestKpm));
  const days = last14(p.days);
  const maxMin = Math.max(5, ...days.map(d => d.min));

  // Miss rate per key (only keys typed at least 10 times, so one slip doesn't paint a key red).
  const heat: Record<string, number> = {};
  const weak: { k: string; rate: number }[] = [];
  for (const [k, s] of Object.entries(p.keys)) {
    const n = s.hit + s.miss;
    if (n < 10) continue;
    const rate = s.miss / n;
    heat[k] = Math.min(1, rate * 4); // 25%+ misses = full colour
    if (rate >= 0.08 && k !== ' ') weak.push({ k, rate });
  }
  weak.sort((a, b) => b.rate - a.rate);

  const wordsByGrade = GRADES.map(g => {
    const recs = Object.entries(p.words).filter(([id]) => id.startsWith(`${g}-`)).map(([, r]) => r);
    return { g, learned: recs.filter(r => r.box >= 1).length, mastered: recs.filter(r => r.box >= MASTERED_BOX).length, total: index?.grades[g]?.count ?? 0 };
  });

  return (
    <div>
      <PageTitle icon="📈" title={t('progress.title')} sub={t('progress.sub')} />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t('progress.streak')} value={streakDays(p)} unit={t('progress.days')} color="orange" />
        <Stat label={t('progress.time')} value={Math.round(totalSec / 60)} unit={t('progress.min')} color="teal" />
        <Stat label={t('progress.keys')} value={totalKeys.toLocaleString()} color="violet" />
        <Stat label={t('progress.bestSpeed')} value={bestKpm} unit={t('stat.kpm')} color="green" />
      </div>

      <section className="card mb-8 p-5">
        <h2 className="mb-4 font-black">{t('progress.last14')}</h2>
        <div className="flex h-40 items-end gap-[2px]" role="img" aria-label={days.map(d => `${d.label}: ${d.min}`).join(', ')}>
          {days.map((d, i) => (
            <div
              key={d.key}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {(hover === i || (i === 13 && hover === null)) && (
                <div className="absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-card px-2 py-1 text-xs font-bold shadow-card">
                  {d.label} · {d.min} {t('progress.min')}
                </div>
              )}
              <div
                className="w-full max-w-7 rounded-t"
                style={{ height: `${(d.min / maxMin) * 100}%`, minHeight: d.min ? 4 : 2, background: d.min ? 'var(--teal)' : 'var(--line)', opacity: hover === null || hover === i ? 1 : 0.55 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-[2px] text-[11px] text-muted">
          {days.map((d, i) => <span key={d.key} className="flex-1 text-center">{i % 2 === 1 ? d.label : ''}</span>)}
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black">{t('progress.typing')}</h2>
            <span className="flex items-center gap-1 font-extrabold"><Stars n={1} max={1} size={18} /> {stars} / {LESSONS.length * 3}</span>
          </div>
          <ProgressBar value={stars / (LESSONS.length * 3)} color="orange" />
          <h3 className="mb-2 mt-5 text-sm font-black text-ink-2">{t('progress.weakKeys')}</h3>
          {weak.length ? (
            <div className="flex flex-wrap gap-2">
              {weak.slice(0, 8).map(w => (
                <span key={w.k} className="flex items-center gap-1 rounded-xl border-2 border-coral-line bg-coral-soft px-2 py-1">
                  <kbd className="font-display text-lg font-black">{w.k}</kbd>
                  <span className="text-xs font-bold text-coral-ink">{Math.round(w.rate * 100)}%</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{t('progress.noWeak')}</p>
          )}
          <div className="mt-4">
            {/* Same as the lesson intro: on phones the keyboard reaches into the card's padding. */}
            <div className="-mx-4 sm:mx-0"><Keyboard layout={settings.layout} heat={heat} compact /></div>
            <p className="mt-2 text-xs text-muted">{t('progress.heatNote')}</p>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-black">{t('progress.words')}</h2>
          <ul className="space-y-4">
            {wordsByGrade.map(({ g, learned, mastered, total }) => (
              <li key={g}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-black" style={{ color: `var(--${GRADE_INFO[g].color}-ink)` }}><Tx text={gradeName(g, lang)} /></span>
                  <span className="font-bold text-muted">{t('progress.learnedOf', { n: learned, m: mastered, total })}</span>
                </div>
                <ProgressBar value={total ? learned / total : 0} color={GRADE_INFO[g].color} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">{t('progress.wordsNote')}</p>
        </section>
      </div>
    </div>
  );
}
