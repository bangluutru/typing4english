import { Lock } from 'lucide-react';
import { LESSONS, STAGES, isUnlocked } from '../lib/curriculum';
import { lessonLabel, nextLessonIndex } from '../lib/learning';
import { useProgress } from '../lib/store';
import { useT, type TKey } from '../lib/i18n';
import { href } from '../lib/router';
import { PageTitle, Stars } from '../components/ui';

export function CoursePage() {
  const { t, s, lang } = useT();
  const progress = useProgress();
  const stars = (id: string) => progress.lessons[id]?.stars ?? 0;
  const next = nextLessonIndex(stars);
  const total = LESSONS.reduce((n, l) => n + stars(l.id), 0);

  return (
    <div>
      <PageTitle
        icon="⌨️"
        title={t('course.title')}
        sub={t('course.sub')}
        right={<div className="flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-2 font-extrabold"><Stars n={1} max={1} /> {total} / {LESSONS.length * 3}</div>}
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {(['tip.ime', 'tip.home', 'tip.posture'] as const).map((k, i) => (
          <div key={k} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
            <span className="whitespace-nowrap text-xl font-black" aria-hidden="true">{['あ→A', '👆', '🪑'][i]}</span>
            <p className="text-sm font-semibold text-ink-2">{t(k)}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {STAGES.map(stage => {
          const lessons = LESSONS.map((l, i) => ({ l, i })).filter(x => x.l.stage === stage.n);
          return (
            <section key={stage.n} aria-labelledby={`stage-${stage.n}`}>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl" style={{ background: `var(--${stage.color}-soft)` }} aria-hidden="true">{stage.icon}</span>
                <div>
                  <h2 id={`stage-${stage.n}`} className="text-lg font-black">{t(`stage.${stage.n}` as TKey)}</h2>
                  <p className="text-sm text-muted">{t(`stage.${stage.n}.desc` as TKey)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {lessons.map(({ l, i }) => {
                  const open = isUnlocked(i, stars);
                  const isNext = i === next;
                  const inner = (
                    <>
                      <span className="text-xs font-bold text-muted">{l.id}</span>
                      <span className="my-1 flex min-h-10 items-center justify-center text-center font-display text-xl font-black leading-tight">
                        {open ? lessonLabel(l, s, lang) : <Lock size={22} className="text-muted" />}
                      </span>
                      <Stars n={stars(l.id)} size={18} />
                    </>
                  );
                  const cls = `flex flex-col items-center rounded-2xl border-2 p-3 transition ${isNext ? 'animate-pop' : ''}`;
                  return open ? (
                    <a
                      key={l.id}
                      href={href(`typing/${l.id}`)}
                      className={`${cls} bg-card hover:-translate-y-0.5 hover:shadow-card`}
                      style={{ borderColor: isNext ? `var(--${stage.color})` : 'var(--line)', boxShadow: isNext ? `0 0 0 4px var(--${stage.color}-soft)` : undefined }}
                    >
                      {isNext && <span className="-mt-6 mb-1 rounded-full px-2 py-0.5 text-xs font-black text-on-fill" style={{ background: `var(--${stage.color})` }}>{t('course.next')}</span>}
                      {inner}
                    </a>
                  ) : (
                    <div key={l.id} className={`${cls} border-dashed border-line bg-dim opacity-70`} aria-disabled="true">{inner}</div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
