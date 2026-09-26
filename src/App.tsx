import { useEffect, type ReactNode } from 'react';
import { BarChart3, BookOpen, Gamepad2, Home, Keyboard as KeyboardIcon, Settings as SettingsIcon } from 'lucide-react';
import { useRoute, href } from './lib/router';
import { useSettings } from './lib/store';
import { useT, type TKey } from './lib/i18n';
import { EIKYU_BASE } from './lib/audio';
import { HomePage } from './pages/HomePage';
import { CoursePage } from './pages/CoursePage';
import { LessonPage } from './pages/LessonPage';
import { WordsPage } from './pages/WordsPage';
import { StudyPage } from './pages/StudyPage';
import { GamePage } from './pages/GamePage';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import type { GradeId } from './lib/store';

const CHOTTO_URL = 'https://chottoday.com';
const MUC = '#1E2A44'; // Chotto "Mực", same in both themes, like the strip on chottoday.com's sister apps
const PAPER = '#FBF9F5';

const NAV: { path: string; icon: ReactNode; key: TKey; color: string }[] = [
  { path: '', icon: <Home size={20} />, key: 'nav.home', color: 'teal' },
  { path: 'typing', icon: <KeyboardIcon size={20} />, key: 'nav.typing', color: 'teal' },
  { path: 'words', icon: <BookOpen size={20} />, key: 'nav.words', color: 'green' },
  { path: 'game', icon: <Gamepad2 size={20} />, key: 'nav.game', color: 'orange' },
  { path: 'progress', icon: <BarChart3 size={20} />, key: 'nav.progress', color: 'violet' },
];

function useApplySettings() {
  const [s] = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    root.lang = s.uiLang;
    root.dataset.furigana = s.furigana ? 'on' : 'off';
    const apply = () => {
      const dark = s.theme === 'dark' || (s.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    if (s.theme !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [s.uiLang, s.furigana, s.theme]);
}

/**
 * Thin Mực strip above the header on wide screens, the same one 英級アップ
 * carries: "Chotto › Study tools › Typing4English" on the left, the sister app
 * on the right. It is what ties the subdomain back to chottoday.com at a glance
 * when someone arrives from its "Ứng dụng của Chotto" block.
 */
function ChottoStrip() {
  const { t, lang } = useT();
  return (
    <div className="hidden h-9 md:block" style={{ background: MUC, color: PAPER }}>
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 text-[13px]">
        <nav aria-label="Chotto">
          <ol className="flex list-none items-center gap-1.5 whitespace-nowrap">
            <li>
              <a href={CHOTTO_URL} className="font-display font-extrabold underline-offset-2 hover:underline">Chotto</a>
            </li>
            <li aria-hidden="true" className="opacity-60">›</li>
            <li className="opacity-80">{t('brand.stripTools')}</li>
            <li aria-hidden="true" className="opacity-60">›</li>
            <li aria-current="page" className="font-bold" style={{ borderBottom: '2px solid var(--teal)' }}>Typing4English</li>
          </ol>
        </nav>
        <a href={`${EIKYU_BASE}/?lang=${lang}`} className="whitespace-nowrap opacity-90 underline-offset-2 hover:underline">
          英級アップ <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}

function Header({ section }: { section: string }) {
  const { t, p } = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <a href={href('')} className="mr-2 flex items-center gap-2 rounded-xl" aria-label="Typing4English">
          <img src="/favicon.svg" alt="" width={36} height={36} className="rounded-lg" />
          <span className="hidden font-display text-lg font-black leading-none sm:block">
            Typing<span className="text-teal-ink">4</span>English
          </span>
        </a>
        <a
          href={CHOTTO_URL}
          className="-ml-2 mr-2 hidden self-center pt-1 text-xs font-bold text-muted hover:text-ink hover:underline sm:block"
          title={p('brand.home')}
        >
          by Chotto
        </a>
        <nav className="flex flex-1 items-center justify-end gap-1 sm:justify-center" aria-label={p('nav.menu')}>
          {NAV.map(n => {
            const active = section === n.path;
            return (
              <a
                key={n.path}
                href={href(n.path)}
                aria-current={active ? 'page' : undefined}
                title={p(n.key)}
                className={`flex h-11 items-center gap-1.5 rounded-xl px-2.5 text-sm font-extrabold transition md:px-3 ${active ? '' : 'text-ink-2 hover:bg-dim'}`}
                style={active ? { background: `var(--${n.color}-soft)`, color: `var(--${n.color}-ink)` } : undefined}
              >
                {n.icon}
                <span className="hidden md:inline">{t(n.key)}</span>
              </a>
            );
          })}
        </nav>
        <a
          href={href('settings')}
          aria-current={section === 'settings' ? 'page' : undefined}
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${section === 'settings' ? 'bg-tint' : 'hover:bg-dim'} text-ink-2`}
          aria-label={p('nav.settings')}
          title={p('nav.settings')}
        >
          <SettingsIcon size={20} />
        </a>
      </div>
    </header>
  );
}

function Footer() {
  const { t, lang } = useT();
  return (
    <footer className="mt-12 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <a href={CHOTTO_URL} target="_blank" rel="noopener" className="flex items-center gap-2 font-bold hover:text-ink">
          <span className="flex gap-0.5" aria-hidden="true">
            {['green', 'teal', 'orange', 'coral', 'violet'].map(c => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--${c})` }} />)}
          </span>
          {t('footer.chotto')}
        </a>
        <span>
          {t('footer.vocab')}{' '}
          <a href={`${EIKYU_BASE}/?lang=${lang}`} target="_blank" rel="noopener" className="font-bold text-coral-ink hover:underline">英級アップ</a>
        </span>
      </div>
    </footer>
  );
}

export default function App() {
  useApplySettings();
  const route = useRoute();
  const [section = '', a, b, c] = route;

  let page: ReactNode;
  let focusMode = false; // hide footer while typing
  switch (section) {
    case 'typing':
      if (a) { page = <LessonPage id={a} />; focusMode = true; }
      else page = <CoursePage />;
      break;
    case 'words':
      page = <WordsPage grade={a as GradeId | undefined} topic={b} />;
      break;
    case 'study':
      page = <StudyPage grade={a as GradeId} topic={b} set={c} />;
      focusMode = true;
      break;
    case 'game':
      page = <GamePage />;
      focusMode = true;
      break;
    case 'progress':
      page = <ProgressPage />;
      break;
    case 'settings':
      page = <SettingsPage />;
      break;
    default:
      page = <HomePage />;
  }

  const navSection = section === 'study' ? 'words' : section;
  return (
    <div className="flex min-h-screen flex-col">
      <ChottoStrip />
      <Header section={navSection} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">{page}</main>
      {!focusMode && <Footer />}
    </div>
  );
}
