import { useState, useEffect } from 'react';
import { SuiteHomePage } from './pages/SuiteHomePage';
import { NavigationShell } from './components/NavigationShell';
import { TypingPracticeApp } from './modules/typing-practice/TypingPracticeApp';
import { WordBattleApp } from './modules/word-battle/WordBattleApp';
import { UnifiedSettingsPage } from './pages/UnifiedSettingsPage';
import type { Level } from './types/game';

type AppMode = 'home' | 'typing-practice' | 'word-battle' | 'settings';

export function SuiteApp() {
  const [currentMode, setCurrentMode] = useState<AppMode>('home');
  const [bridgedLevel, setBridgedLevel] = useState<Level | null>(null);

  // Apply initial theme from Word Battle configuration
  useEffect(() => {
    try {
      const saved = localStorage.getItem('typing_adventure_wb_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme) {
          document.body.setAttribute('data-theme', parsed.theme);
        }
      } else {
        document.body.setAttribute('data-theme', 'cyberpunk');
      }
    } catch {
      // ignore
    }
  }, [currentMode]);

  const handleBackToHome = () => {
    setCurrentMode('home');
    setBridgedLevel(null);
  };

  // Learning path bridge from TypeMaster results page
  const handleGoToWordBattle = (_focusKeys?: string[]) => {
    setBridgedLevel('Alphabet'); // Map lessons completed to Alphabet level
    setCurrentMode('word-battle');
  };

  const renderContent = () => {
    switch (currentMode) {
      case 'home':
        return <SuiteHomePage onSelectModule={setCurrentMode} />;
      case 'settings':
        return <UnifiedSettingsPage />;
      case 'typing-practice':
        return (
          <TypingPracticeApp 
            onBackToHome={handleBackToHome}
            onGoToWordBattle={handleGoToWordBattle}
          />
        );
      case 'word-battle':
        return (
          <WordBattleApp 
            onBackToHome={handleBackToHome}
            initialLevel={bridgedLevel}
          />
        );
      default:
        return <SuiteHomePage onSelectModule={setCurrentMode} />;
    }
  };

  // Typing practice and Word Battle manage their own headers internally.
  // We only show the global outer NavigationShell for Home and Settings pages!
  const showGlobalHeader = currentMode === 'home' || currentMode === 'settings';

  return (
    <div className="w-full min-h-screen flex flex-col">
      {showGlobalHeader && (
        <NavigationShell 
          currentMode={currentMode}
          onSelectMode={setCurrentMode}
        />
      )}
      <main className="flex-1 w-full flex flex-col justify-start items-center">
        {renderContent()}
      </main>
    </div>
  );
}

export default SuiteApp;
