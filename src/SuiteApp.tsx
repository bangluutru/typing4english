import { useState, useEffect } from 'react';
import { SuiteHomePage } from './pages/SuiteHomePage';
import { NavigationShell } from './components/NavigationShell';
import { TypingPracticeApp } from './modules/typing-practice/TypingPracticeApp';
import { WordBattleApp } from './modules/word-battle/WordBattleApp';
import { UnifiedSettingsPage } from './pages/UnifiedSettingsPage';
import type { Level } from './types/game';

type AppMode = 'home' | 'typing-practice' | 'word-battle' | 'settings';

export type AppTheme = 'cyberpunk' | 'magical';

export function SuiteApp() {
  const [currentMode, setCurrentMode] = useState<AppMode>('home');
  const [bridgedLevel, setBridgedLevel] = useState<Level | null>(null);
  
  // 1. Top-level theme state synchronized with localStorage
  const [appTheme, setAppTheme] = useState<AppTheme>(() => {
    try {
      const savedTheme = localStorage.getItem('typing_adventure_app_theme');
      if (savedTheme === 'cyberpunk' || savedTheme === 'magical') {
        return savedTheme;
      }
      // Fallback: check Word Battle settings
      const wbSaved = localStorage.getItem('typing_adventure_wb_settings');
      if (wbSaved) {
        const parsed = JSON.parse(wbSaved);
        if (parsed.theme === 'cyberpunk' || parsed.theme === 'magical') {
          return parsed.theme;
        }
      }
    } catch {
      // ignore
    }
    return 'cyberpunk';
  });

  // 2. Coordinated setter that propagates themes to all module configs
  const handleSetAppTheme = (newTheme: AppTheme) => {
    setAppTheme(newTheme);
    try {
      localStorage.setItem('typing_adventure_app_theme', newTheme);
      document.body.setAttribute('data-theme', newTheme);

      // A. Sync to Word Battle Settings
      const wbSaved = localStorage.getItem('typing_adventure_wb_settings');
      let wbSettings: any = { theme: newTheme };
      if (wbSaved) {
        try {
          wbSettings = { ...JSON.parse(wbSaved), theme: newTheme };
        } catch {
          // ignore
        }
      }
      
      // Auto default shooter type if theme changed
      if (newTheme === 'cyberpunk') {
        if (wbSettings.shooterType === 'butterfly' || wbSettings.shooterType === 'turtle') {
          wbSettings.shooterType = 'airplane';
        }
      } else if (newTheme === 'magical') {
        if (wbSettings.shooterType === 'airplane' || wbSettings.shooterType === 'tank') {
          wbSettings.shooterType = 'butterfly';
        }
      }
      localStorage.setItem('typing_adventure_wb_settings', JSON.stringify(wbSettings));

      // B. Sync to Typing Practice Settings
      const tpSaved = localStorage.getItem('typing_adventure_typing_settings');
      let tpSettings = { theme: newTheme === 'cyberpunk' ? 'dark' : 'kid' };
      if (tpSaved) {
        try {
          tpSettings = { ...JSON.parse(tpSaved), theme: newTheme === 'cyberpunk' ? 'dark' : 'kid' };
        } catch {
          // ignore
        }
      }
      localStorage.setItem('typing_adventure_typing_settings', JSON.stringify(tpSettings));
    } catch (e) {
      console.error('Failed to sync theme', e);
    }
  };

  // 3. Keep body element's data-theme attribute reactive
  useEffect(() => {
    document.body.setAttribute('data-theme', appTheme);
  }, [appTheme]);

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
        return <SuiteHomePage onSelectModule={setCurrentMode} appTheme={appTheme} />;
      case 'settings':
        return <UnifiedSettingsPage appTheme={appTheme} onSetAppTheme={handleSetAppTheme} />;
      case 'typing-practice':
        return (
          <TypingPracticeApp 
            onBackToHome={handleBackToHome}
            onGoToWordBattle={handleGoToWordBattle}
            appTheme={appTheme}
          />
        );
      case 'word-battle':
        return (
          <WordBattleApp 
            onBackToHome={handleBackToHome}
            initialLevel={bridgedLevel}
            appTheme={appTheme}
            onSetAppTheme={handleSetAppTheme}
          />
        );
      default:
        return <SuiteHomePage onSelectModule={setCurrentMode} appTheme={appTheme} />;
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
          appTheme={appTheme}
        />
      )}
      <main className="flex-1 w-full flex flex-col justify-start items-center">
        {renderContent()}
      </main>
    </div>
  );
}

export default SuiteApp;
