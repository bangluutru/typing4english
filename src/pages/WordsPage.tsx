import { useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { GRADES, GRADE_INFO, TOPICS, gradeName, meaningOf, topicName, topicSets, useGrade } from '../lib/vocab';
import { useProgress, useSettings, type GradeId } from '../lib/store';
import { dueWords, learnedIn, setStars } from '../lib/learning';
import { useT } from '../lib/i18n';
import { Tx } from '../components/Tx';
import { href, navigate } from '../lib/router';
import { PageTitle, Pill, ProgressBar, Stars } from '../components/ui';

export function GradeTabs({ grade, onPick }: { grade: GradeId; onPick: (g: GradeId) => void }) {
  const { lang } = useT();
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist">
      {GRADES.map(g => {
        const on = g === grade;
        const c = GRADE_INFO[g].color;
        return (
          <button
            key={g}
            role="tab"
            aria-selected={on}
            onClick={() => onPick(g)}
            className="flex shrink-0 flex-col items-start rounded-2xl border-2 px-4 py-2 text-left transition"
            style={{ borderColor: on ? `var(--${c})` : 'var(--line)', background: on ? `var(--${c}-soft)` : 'var(--card)' }}
          >
            <span className="font-black" style={{ color: on ? `var(--${c}-ink)` : undefined }}><Tx text={gradeName(g, lang)} /></span>
            <span className="text-xs text-muted"><Tx text={GRADE_INFO[g].level[lang]} /></span>
          </button>
        );
      })}
    </div>
  );
}

export function WordsPage({ grade: routeGrade, topic }: { grade?: GradeId; topic?: string }) {
  const { t, lang } = useT();
  const [settings, set] = useSettings();
  const grade = routeGrade && GRADES.includes(routeGrade) ? routeGrade : settings.grade;
  const { words, error } = useGrade(grade);
  const progress = useProgress();

  useEffect(() => { if (grade !== settings.grade) set({ grade }); }, [grade]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="card p-6 text-center font-bold">{t('common.loadError')}</p>;

  if (topic && words) {
    const sets = topicSets(words, topic);
    return (
      <div>
        <a href={href(`words/${grade}`)} className="mb-4 inline-flex items-center gap-1 font-bold text-ink-2 hover:text-ink"><ArrowLeft size={18} />{t('words.allTopics')}</a>
        <PageTitle icon={TOPICS[topic]?.icon} title={<Tx text={topicName(topic, lang)} />} sub={<><Tx text={gradeName(grade, lang)} /> · {t('words.nWords', { n: sets.flat().length })}</>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((ws, i) => {
            const st = setStars(ws, progress);
            return (
              <a key={i} href={href(`study/${grade}/${topic}/${i}`)} className="card flex flex-col p-4 transition hover:-translate-y-0.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-black">{t('words.setN', { n: i + 1 })}</span>
                  <Stars n={st} size={18} />
                </div>
                <ul className="flex-1 space-y-0.5 text-sm">
                  {ws.map(w => {
                    const box = progress.words[w.id]?.box ?? 0;
                    return (
                      <li key={w.id} className="flex justify-between gap-2">
                        <span className="font-bold">{w.w}</span>
                        <span className="truncate text-right text-muted">{box > 0 ? meaningOf(w, settings.meaningLang) : '・・・'}</span>
                      </li>
                    );
                  })}
                </ul>
                <span className="btn btn-sm btn-primary mt-3 self-end">{st > 0 ? t('words.again') : t('words.learn')}</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  const topics = words ? [...new Set(words.map(w => w.t))] : [];
  const due = words ? dueWords(words, progress) : [];
  const learned = words ? learnedIn(words, progress) : 0;

  return (
    <div>
      <PageTitle icon="📚" title={t('words.title')} sub={t('words.sub')} />
      <GradeTabs grade={grade} onPick={g => navigate(`words/${g}`)} />

      {!words ? (
        <p className="py-12 text-center text-muted">{t('common.loading')}</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="card flex items-center gap-4 p-5">
              <div className="text-4xl" aria-hidden="true">🌱</div>
              <div className="flex-1">
                <div className="font-black">{t('words.learnedN', { n: learned, total: words.length })}</div>
                <div className="mt-2"><ProgressBar value={learned / words.length} color="green" /></div>
              </div>
            </div>
            <div className="card flex items-center gap-4 p-5" style={due.length ? { borderColor: 'var(--orange)', background: 'var(--orange-soft)' } : undefined}>
              <RefreshCw size={32} className="text-orange-ink" aria-hidden="true" />
              <div className="flex-1">
                <div className="font-black">{t('words.reviewN', { n: due.length })}</div>
                <div className="text-sm text-ink-2">{t('words.reviewHint')}</div>
              </div>
              <button className="btn btn-orange" disabled={!due.length} onClick={() => navigate(`study/${grade}/review`)}>{t('words.review')}</button>
            </div>
          </div>

          <h2 className="mb-3 text-lg font-black">{t('words.topics')}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {topics.map(tp => {
              const list = words.filter(w => w.t === tp);
              const n = learnedIn(list, progress);
              return (
                <a key={tp} href={href(`words/${grade}/${tp}`)} className="card flex flex-col gap-2 p-4 transition hover:-translate-y-0.5">
                  <span className="text-3xl" aria-hidden="true">{TOPICS[tp]?.icon ?? '📘'}</span>
                  <span className="font-black leading-tight"><Tx text={topicName(tp, lang)} /></span>
                  <span className="flex items-center justify-between text-xs font-bold text-muted">
                    <Pill color={n === list.length ? 'green' : 'teal'}>{n} / {list.length}</Pill>
                  </span>
                  <ProgressBar value={n / list.length} color="green" />
                </a>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
