import { useState, useEffect } from 'react';
import { Home as HomeIcon, Award, BarChart2, Settings as SettingsIcon, Keyboard, Star, ArrowLeft } from 'lucide-react';
import { useSettings } from './stores/settingsStore';
import { useProgress } from './stores/progressStore';
import { TypingHomePage } from './pages/TypingHomePage';
import { LessonsPage } from './pages/LessonsPage';
import { PracticePage } from './pages/PracticePage';
import { ResultPage } from './pages/ResultPage';
import { ProgressDashboard } from './components/ProgressDashboard';
import { SettingsPage } from './pages/SettingsPage';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { useTranslation } from '../../i18n/useTranslation';

export type TypingPageType = 'home' | 'lessons' | 'practice' | 'result' | 'dashboard' | 'settings';

interface TypingPracticeAppProps {
  onBackToHome: () => void;
  onGoToWordBattle?: (focusKeys?: string[]) => void;
  appTheme?: 'cyberpunk' | 'magical';
}

export function TypingPracticeApp({ onBackToHome, onGoToWordBattle, appTheme }: TypingPracticeAppProps) {
  const [settings, setSettings] = useSettings();
  const {
    progress,
    completeLesson,
    updateTimeSpentOnly,
    resetProgress,
    importProgress,
  } = useProgress();

  const [currentPage, setCurrentPage] = useState<TypingPageType>('home');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('l1-1');
  const [lastResult, setLastResult] = useState<{
    wpm: number;
    accuracy: number;
    timeSpent: number;
    errors: Record<string, number>;
  } | null>(null);

  const t = useTranslation();

  // Sync settings theme to body class list
  useEffect(() => {
    const body = document.body;
    body.classList.add('typing-practice-active');
    body.classList.remove('dark', 'kid', 'dark-mode-active', 'kid-mode-active');
    
    if (settings.theme === 'dark') {
      body.classList.add('dark', 'dark-mode-active');
    } else if (settings.theme === 'kid') {
      body.classList.add('kid', 'kid-mode-active');
    }
    
    return () => {
      body.classList.remove('typing-practice-active', 'dark', 'kid', 'dark-mode-active', 'kid-mode-active');
    };
  }, [settings.theme]);

  // Synchronize top-level appTheme with local settings
  useEffect(() => {
    if (appTheme === 'cyberpunk' && settings.theme !== 'dark') {
      setSettings({ theme: 'dark' });
    } else if (appTheme === 'magical' && settings.theme !== 'kid') {
      setSettings({ theme: 'kid' });
    }
  }, [appTheme, settings.theme, setSettings]);

  // Track practice time
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && currentPage !== 'practice') {
        updateTimeSpentOnly(5);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPage, updateTimeSpentOnly]);

  const handleLessonComplete = (
    wpm: number,
    accuracy: number,
    timeSpent: number,
    errors: Record<string, number>
  ) => {
    setLastResult({ wpm, accuracy, timeSpent, errors });
    completeLesson(selectedLessonId, wpm, accuracy, timeSpent, errors);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <TypingHomePage
            progress={progress}
            onNavigate={setCurrentPage}
            onSelectLesson={setSelectedLessonId}
          />
        );
      case 'lessons':
        return (
          <LessonsPage
            progress={progress}
            onNavigate={setCurrentPage}
            onSelectLesson={setSelectedLessonId}
          />
        );
      case 'practice':
        return (
          <PracticePage
            lessonId={selectedLessonId}
            settings={settings}
            onNavigate={setCurrentPage}
            onLessonComplete={handleLessonComplete}
          />
        );
      case 'result':
        return (
          <ResultPage
            lessonId={selectedLessonId}
            result={lastResult}
            onNavigate={setCurrentPage}
            onSelectLesson={setSelectedLessonId}
            onGoToWordBattle={onGoToWordBattle}
          />
        );
      case 'dashboard':
        return (
          <div className="flex flex-col items-center gap-4 py-4 w-full animate-tp-pulse-slow">
            <div className="text-center flex flex-col gap-2 mb-2">
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 font-display uppercase tracking-wider">
                <BarChart2 className="w-7 h-7 text-tp-primary-500" />
                {t('typingPractice.nav.dashboard')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t('typingPractice.dashboard.noProgressYet')}
              </p>
            </div>
            <ProgressDashboard
              progress={progress}
              onReset={resetProgress}
            />
          </div>
        );
      case 'settings':
        return (
          <SettingsPage
            settings={settings}
            onUpdateSettings={setSettings}
            progress={progress}
            onImportProgress={importProgress}
            onResetProgress={resetProgress}
          />
        );
      default:
        return <TypingHomePage progress={progress} onNavigate={setCurrentPage} onSelectLesson={setSelectedLessonId} />;
    }
  };

  return (
    <ErrorBoundary module="typing-practice">
      <div className="typing-practice-module min-h-screen flex flex-col justify-between w-full">
        <header className="sticky top-0 z-50 tp-glass border-b border-slate-200/40 dark:border-slate-800/40 shadow-sm backdrop-blur-md">
          <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center select-none">
            <div
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 cursor-pointer transition-transform duration-200 active:scale-95 group"
            >
              <div className="p-2 rounded-xl bg-tp-primary-500 text-white shadow-md shadow-tp-primary-500/20 group-hover:scale-105 transition-transform">
                <Keyboard className="w-5 h-5" />
              </div>
              <span className="font-black text-lg sm:text-xl tracking-tight text-slate-800 dark:text-slate-100 font-display">
                Type<span className="text-tp-primary-500 font-extrabold">Master</span>
              </span>
            </div>

            <nav className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'home', label: t('navigation.home'), icon: HomeIcon },
                { id: 'lessons', label: t('typingPractice.lessons.title'), icon: Award },
                { id: 'dashboard', label: t('typingPractice.nav.dashboard'), icon: BarChart2 },
                { id: 'settings', label: t('navigation.settings'), icon: SettingsIcon },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id || (item.id === 'lessons' && currentPage === 'practice') || (item.id === 'lessons' && currentPage === 'result');
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as TypingPageType)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-tp-primary-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
              
              <button
                onClick={onBackToHome}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 border border-red-500/20 ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common.exit')}</span>
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 flex flex-col items-center">
          {renderPage()}
        </main>

        <footer className="w-full border-t border-slate-200/40 dark:border-slate-800/40 py-6 bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm select-none text-center">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400 dark:text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span>⌨️ Typing4English © 2026. Made with</span>
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>for English learners.</span>
            </div>
            <div className="flex gap-4 font-semibold">
              <span className="hover:text-tp-primary-500 cursor-pointer" onClick={() => setCurrentPage('lessons')}>{t('typingPractice.lessons.title')}</span>
              <span>•</span>
              <span className="hover:text-tp-primary-500 cursor-pointer" onClick={() => setCurrentPage('settings')}>{t('settings.exportDataBtn')}</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

