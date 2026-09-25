import { ArrowRight } from 'lucide-react';
import { LESSONS } from '../lib/curriculum';
import { dayKey, streakDays, useProgress, useSettings } from '../lib/store';
import { gradeName, useGrade, useVocabIndex } from '../lib/vocab';
import { useT } from '../lib/i18n';
import { Tx } from '../components/Tx';
import { href } from '../lib/router';
import { ProgressBar, Stars } from '../components/ui';
import { dueWords, learnedIn, lessonLabel, nextLessonIndex } from '../lib/learning';

export function HomePage() {
  const { t, s, lang } = useT();
  const [settings] = useSettings();
  const p = useProgress();
  const index = useVocabIndex();
  const { words } = useGrade(settings.grade);

  const stars = (id: string) => p.lessons[id]?.stars ?? 0;
  const nextIdx = nextLessonIndex(stars);
  const nextLesson = LESSONS[nextIdx];
  const lessonsDone = LESSONS.filter(l => stars(l.id) > 0).length;
  const streak = streakDays(p);
  const todayMin = Math.round((p.days[dayKey()]?.sec ?? 0) / 60);
  const due = words ? dueWords(words, p).length : 0;
  const learned = words ? learnedIn(words, p) : 0;
  const gradeTotal = index?.grades[settings.grade]?.count ?? 0;
  const firstTime = Object.keys(p.days).length === 0;

  const cards = [
    {
      color: 'teal', icon: '⌨️', title: t('home.typing'), desc: t('home.typingDesc'),
      meta: <><span>{t('home.lessonsDone', { n: lessonsDone, total: LESSONS.length })}</span><ProgressBar value={lessonsDone / LESSONS.length} color="teal" /></>,
      cta: t('home.continueLesson', { n: nextLesson.id, label: lessonLabel(nextLesson, s, lang) }),
      link: href(`typing/${nextLesson.id}`),
    },
    {
      color: 'green', icon: '📚', title: t('home.words'), desc: t('home.wordsDesc'),
      meta: <><span><Tx text={gradeName(settings.grade, lang)} /> · {t('words.learnedN', { n: learned, total: gradeTotal })}</span><ProgressBar value={gradeTotal ? learned / gradeTotal : 0} color="green" /></>,
      cta: due ? t('home.reviewN', { n: due }) : t('home.pickTopic'),
      link: due ? href(`study/${settings.grade}/review`) : href(`words/${settings.grade}`),
    },
    {
      color: 'orange', icon: '🎈', title: t('home.game'), desc: t('home.gameDesc'),
      meta: <span>{t('home.gameMeta')}</span>,
      cta: t('home.play'),
      link: href('game'),
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-card p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-teal-soft" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-orange-soft" aria-hidden="true" />
        <div className="relative">
          <p className="font-bold text-teal-ink">{t(firstTime ? 'home.hello' : 'home.welcomeBack')}</p>
          <h1 className="mt-1 max-w-2xl font-display text-3xl font-black leading-tight sm:text-5xl">{t('home.headline')}</h1>
          <p className="mt-3 max-w-xl text-lg text-ink-2">{t('home.sub')}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a className="btn btn-primary btn-lg" href={cards[0].link}>
              {t(firstTime ? 'home.startFirst' : 'home.continue')}<ArrowRight size={20} />
            </a>
            {!firstTime && (
              <div className="flex gap-2">
                <span className="rounded-2xl bg-orange-soft px-4 py-2 font-extrabold text-orange-ink">🔥 {t('home.streak', { n: streak })}</span>
                <span className="rounded-2xl bg-teal-soft px-4 py-2 font-extrabold text-teal-ink">⏱ {t('home.today', { n: todayMin })}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-black">{t('home.path')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((c, i) => (
            <a key={i} href={c.link} className="card group flex flex-col p-5 transition hover:-translate-y-1" style={{ borderTop: `6px solid var(--${c.color})` }}>
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `var(--${c.color}-soft)` }} aria-hidden="true">{c.icon}</span>
                <div>
                  <div className="text-xs font-black text-muted">STEP {i + 1}</div>
                  <h3 className="text-xl font-black">{c.title}</h3>
                </div>
              </div>
              <p className="mb-4 flex-1 text-ink-2">{c.desc}</p>
              <div className="mb-4 space-y-2 text-sm font-bold text-muted">{c.meta}</div>
              <span className="flex items-center justify-between rounded-xl px-4 py-3 font-black" style={{ background: `var(--${c.color}-soft)`, color: `var(--${c.color}-ink)` }}>
                <span>{c.cta}</span><ArrowRight size={18} className="shrink-0 transition group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </section>

      {firstTime && (
        <section className="card flex flex-wrap items-center gap-4 p-5">
          <span className="whitespace-nowrap text-2xl font-black" aria-hidden="true">あ→A</span>
          <p className="flex-1 font-semibold text-ink-2">{t('tip.ime')}</p>
        </section>
      )}

      {!firstTime && lessonsDone > 0 && (
        <section className="card flex flex-wrap items-center gap-4 p-5">
          <Stars n={Math.min(3, stars(LESSONS[Math.max(0, nextIdx - 1)].id))} />
          <p className="flex-1 font-semibold text-ink-2">{t('home.keepGoing')}</p>
          <a className="btn btn-sm" href={href('progress')}>{t('nav.progress')}</a>
        </section>
      )}
    </div>
  );
}
