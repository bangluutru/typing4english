import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Keyboard, Gamepad2, Globe, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { useSettings } from '../modules/typing-practice/stores/settingsStore';
import { useProgress } from '../modules/typing-practice/stores/progressStore';
import { useAppLanguage } from '../i18n/LanguageProvider';

// Destructure typing coach keys to read/write correctly
interface GameSettings {
  aircraftSpeedMultiplier: number;
  meaningFadeSpeedMultiplier: number;
  meaningFontSizeMultiplier: number;
  uiLanguage: 'vi' | 'en' | 'ja';
  typingCoach: {
    enabled: boolean;
    showVirtualKeyboard: boolean;
    showFingerGuide: boolean;
    showNextKeyHint: boolean;
    showHomeRowHint: boolean;
    animationEnabled: boolean;
    keyboardLayout: string;
    position: string;
    overlayMode: string;
    autoCollapse: boolean;
    showFullKeyboardDuringGame: boolean;
    keyboardSize: number;
    keyboardOpacity: number;
  };
  vocabularyFilter: string;
  shooterType: string;
  theme: 'cyberpunk' | 'magical';
}

const DEFAULT_WB_SETTINGS: GameSettings = {
  aircraftSpeedMultiplier: 1.0,
  meaningFadeSpeedMultiplier: 1.0,
  meaningFontSizeMultiplier: 1.0,
  uiLanguage: 'vi',
  typingCoach: {
    enabled: false,
    showVirtualKeyboard: true,
    showFingerGuide: true,
    showNextKeyHint: true,
    showHomeRowHint: true,
    animationEnabled: true,
    keyboardLayout: 'qwerty',
    position: 'bottom',
    overlayMode: 'auto',
    autoCollapse: true,
    showFullKeyboardDuringGame: true,
    keyboardSize: 100,
    keyboardOpacity: 85,
  },
  vocabularyFilter: 'all',
  shooterType: 'airplane',
  theme: 'cyberpunk',
};

interface UnifiedSettingsPageProps {
  appTheme?: 'cyberpunk' | 'magical';
  onSetAppTheme?: (theme: 'cyberpunk' | 'magical') => void;
}

export const UnifiedSettingsPage: React.FC<UnifiedSettingsPageProps> = ({ appTheme, onSetAppTheme }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'typing' | 'battle'>('general');
  const [tpSettings, setTpSettings] = useSettings();
  const { resetProgress: resetTpProgress } = useProgress();
  const { language, setLanguage, t } = useAppLanguage();

  // Word Battle Settings
  const [wbSettings, setWbSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('typing_adventure_wb_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Naming Migration penguin -> turtle
        if (parsed.shooterType === 'penguin') {
          parsed.shooterType = 'turtle';
        }
        return { ...DEFAULT_WB_SETTINGS, ...parsed, uiLanguage: language };
      } catch {
        // ignore
      }
    }
    return { ...DEFAULT_WB_SETTINGS, uiLanguage: language };
  });

  // Sync settings when appTheme changes externally
  useEffect(() => {
    if (appTheme && appTheme !== wbSettings.theme) {
      setWbSettings(prev => ({ ...prev, theme: appTheme }));
    }
  }, [appTheme, wbSettings.theme]);

  // Keep local uiLanguage state in sync with global language
  useEffect(() => {
    if (language !== wbSettings.uiLanguage) {
      setWbSettings(prev => ({ ...prev, uiLanguage: language }));
    }
  }, [language, wbSettings.uiLanguage]);

  const updateWbSettings = (updater: Partial<GameSettings>) => {
    const updated = { ...wbSettings, ...updater };
    setWbSettings(updated);
    localStorage.setItem('typing_adventure_wb_settings', JSON.stringify(updated));
    
    // Apply theme changes if general theme is changed
    if (updater.theme && onSetAppTheme) {
      onSetAppTheme(updater.theme);
    }
  };

  const updateWbTypingCoach = (updater: Partial<GameSettings['typingCoach']>) => {
    const updatedCoach = { ...wbSettings.typingCoach, ...updater };
    const updated = { ...wbSettings, typingCoach: updatedCoach };
    setWbSettings(updated);
    localStorage.setItem('typing_adventure_wb_settings', JSON.stringify(updated));
  };

  const handleResetWbData = () => {
    if (confirm(t('settings.alertWbReset'))) {
      localStorage.removeItem('typing_adventure_wb_word_stats');
      localStorage.removeItem('typing_adventure_wb_lifetime_stats');
      localStorage.removeItem('typing_adventure_wb_custom_lists');
      localStorage.removeItem('typing_adventure_wb_training_mode');
      alert(t('settings.alertWbResetDone'));
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 select-none flex flex-col gap-6">
      
      {/* Title */}
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white flex items-center justify-center gap-2 font-display uppercase tracking-wider drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]">
          <Settings className="w-7 h-7 text-cyber-accent" />
          {t('settings.title')}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 font-medium">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-outline-variant/30 gap-1 sm:gap-2">
        {[
          { id: 'general', label: t('settings.generalTab'), icon: Globe },
          { id: 'typing', label: `${t('settings.typingTab')} (TypeMaster)`, icon: Keyboard },
          { id: 'battle', label: `${t('settings.battleTab')} (Word Battle)`, icon: Gamepad2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-cyber-accent text-cyber-accent font-black'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content panel */}
      <div className="w-full">
        
        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <div className="flex flex-col gap-6 animate-tp-pulse-slow">
            
            {/* UI Language Option */}
            <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2 mb-1">
                <Globe className="w-4 h-4 text-cyber-accent" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-primary-container">
                  {t('settings.uiLanguage')} (UI Language)
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'vi', name: t('settings.langViName'), desc: t('settings.langViDesc') },
                  { id: 'en', name: t('settings.langEnName'), desc: t('settings.langEnDesc') },
                  { id: 'ja', name: t('settings.langJaName'), desc: t('settings.langJaDesc') },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => {
                      setLanguage(lang.id as any);
                      updateWbSettings({ uiLanguage: lang.id as any });
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      language === lang.id
                        ? 'bg-cyber-accent/15 border-cyber-accent text-white font-bold scale-[1.02]'
                        : 'bg-cyber-dark/40 border-outline-variant/30 text-gray-400 hover:border-cyber-accent/50 hover:text-gray-200'
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{lang.name}</span>
                    <span className="text-[9px] opacity-75">{lang.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Application Theme Option */}
            <div className="glass-panel p-5 rounded-3xl flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2 mb-1">
                <Sparkles className="w-4 h-4 text-cyber-magenta" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-primary-container">
                  {t('settings.mainTheme')} (Theme)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'cyberpunk', name: `🌌 ${t('settings.themeCyber')}`, desc: t('settings.themeCyberDesc') },
                  { id: 'magical', name: `💖 ${t('settings.themeMagical')}`, desc: t('settings.themeMagicalDesc') },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateWbSettings({ theme: theme.id as any })}
                    className={`p-4 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      wbSettings.theme === theme.id
                        ? 'bg-gradient-to-r from-cyber-accent/10 to-cyber-magenta/10 border-cyber-accent text-white font-bold scale-[1.02]'
                        : 'bg-cyber-dark/40 border-outline-variant/30 text-gray-400 hover:border-cyber-accent/50 hover:text-gray-200'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black">{theme.name}</span>
                    <span className="text-[9px] opacity-75 leading-relaxed mt-0.5">{theme.desc}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Typing Practice (TypeMaster) Settings */}
        {activeTab === 'typing' && (
          <div className="flex flex-col gap-6 animate-tp-pulse-slow">
            
            {/* Guide & Controls */}
            <div className="glass-panel p-5 rounded-3xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                <Keyboard className="w-4 h-4 text-cyber-accent" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-primary-container">
                  {t('settings.practiceConfig')}
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                
                {/* Audio Switch */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cyber-dark/30 border border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-gray-200">{t('settings.soundEnabled')}</span>
                    <span className="text-[10px] text-gray-400">{t('settings.soundEnabledDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tpSettings.soundEnabled}
                    onChange={(e) => setTpSettings({ soundEnabled: e.target.checked })}
                    className="w-9 h-5 rounded-full bg-slate-600 checked:bg-cyber-accent appearance-none cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:left-4.5"
                  />
                </div>

                {/* Hand Guide Switch */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cyber-dark/30 border border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-gray-200">{t('settings.handsEnabled')}</span>
                    <span className="text-[10px] text-gray-400">{t('settings.handsEnabledDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tpSettings.handsEnabled}
                    onChange={(e) => setTpSettings({ handsEnabled: e.target.checked })}
                    className="w-9 h-5 rounded-full bg-slate-600 checked:bg-cyber-accent appearance-none cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:left-4.5"
                  />
                </div>

                {/* Backspace Switch */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cyber-dark/30 border border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-gray-200">{t('settings.backspaceEnabled')}</span>
                    <span className="text-[10px] text-gray-400">{t('settings.backspaceEnabledDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tpSettings.backspaceEnabled}
                    onChange={(e) => setTpSettings({ backspaceEnabled: e.target.checked })}
                    className="w-9 h-5 rounded-full bg-slate-600 checked:bg-cyber-accent appearance-none cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:left-4.5"
                  />
                </div>

                {/* Font Size Option */}
                <div className="flex flex-col gap-2 mt-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('settings.fontSize')}</span>
                  <div className="grid grid-cols-4 gap-2">
                    {['sm', 'md', 'lg', 'xl'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setTpSettings({ fontSize: size as any })}
                        className={`py-2 rounded-xl border text-xs font-black capitalize transition-all cursor-pointer ${
                          tpSettings.fontSize === size
                            ? 'bg-cyber-accent text-background border-cyber-accent shadow-sm font-bold'
                            : 'bg-cyber-dark/40 border-outline-variant/30 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {size === 'sm' && t('settings.fontSizeSm')}
                        {size === 'md' && t('settings.fontSizeMd')}
                        {size === 'lg' && t('settings.fontSizeLg')}
                        {size === 'xl' && t('settings.fontSizeXl')}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Danger Area */}
            <div className="glass-panel p-5 rounded-3xl border border-red-500/30 bg-red-950/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-red-500/20 pb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-red-400">
                  {t('settings.dangerZoneTp')}
                </h3>
              </div>
              <p className="text-[10px] sm:text-xs text-red-400/80 leading-relaxed font-medium">
                {t('settings.dangerZoneTpDesc')}
              </p>
              <button
                onClick={() => {
                  if (confirm(t('settings.alertTpReset'))) {
                    resetTpProgress();
                    alert(t('settings.alertTpResetDone'));
                  }
                }}
                className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('settings.dangerZoneTpBtn')}</span>
              </button>
            </div>

          </div>
        )}

        {/* Tab 3: Word Battle Settings */}
        {activeTab === 'battle' && (
          <div className="flex flex-col gap-6 animate-tp-pulse-slow">
            
            {/* Speed Configuration */}
            <div className="glass-panel p-5 rounded-3xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                <Sliders className="w-4 h-4 text-cyber-magenta" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-primary-container">
                  {t('settings.speedConfig')}
                </h3>
              </div>

              <div className="flex flex-col gap-4">
                
                {/* Aircraft Speed */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-300">
                    <span>{t('settings.speedLabel')}</span>
                    <span className="text-cyber-magenta">{wbSettings.aircraftSpeedMultiplier}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={wbSettings.aircraftSpeedMultiplier}
                    onChange={(e) => updateWbSettings({ aircraftSpeedMultiplier: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-cyber-dark rounded-full appearance-none cursor-pointer accent-cyber-magenta"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500">
                    <span>{t('settings.speedSlow')}</span>
                    <span>{t('settings.speedNormal')}</span>
                    <span>{t('settings.speedFast')}</span>
                  </div>
                </div>

                {/* Meaning Fade Speed */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-300">
                    <span>{t('settings.speedFadeLabel')}</span>
                    <span className="text-cyber-magenta">{wbSettings.meaningFadeSpeedMultiplier}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={wbSettings.meaningFadeSpeedMultiplier}
                    onChange={(e) => updateWbSettings({ meaningFadeSpeedMultiplier: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-cyber-dark rounded-full appearance-none cursor-pointer accent-cyber-magenta"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500">
                    <span>{t('settings.speedFadeSlow')}</span>
                    <span>{t('settings.speedFadeFast')}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Typing Coach Options */}
            <div className="glass-panel p-5 rounded-3xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                <Keyboard className="w-4 h-4 text-cyber-accent" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-primary-container">
                  {t('settings.coachTitle')}
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                
                {/* Virtual Keyboard */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cyber-dark/30 border border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-gray-200">{t('settings.coachVirtualKb')}</span>
                    <span className="text-[10px] text-gray-400">{t('settings.coachVirtualKbDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wbSettings.typingCoach.showVirtualKeyboard}
                    onChange={(e) => updateWbTypingCoach({ showVirtualKeyboard: e.target.checked })}
                    className="w-9 h-5 rounded-full bg-slate-600 checked:bg-cyber-magenta appearance-none cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:left-4.5"
                  />
                </div>

                {/* Finger Guide */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cyber-dark/30 border border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-gray-200">{t('settings.coachFingerGuide')}</span>
                    <span className="text-[10px] text-gray-400">{t('settings.coachFingerGuideDesc')}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={wbSettings.typingCoach.showFingerGuide}
                    onChange={(e) => updateWbTypingCoach({ showFingerGuide: e.target.checked })}
                    className="w-9 h-5 rounded-full bg-slate-600 checked:bg-cyber-magenta appearance-none cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:left-4.5"
                  />
                </div>

              </div>
            </div>

            {/* Danger Area */}
            <div className="glass-panel p-5 rounded-3xl border border-red-500/30 bg-red-950/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-red-500/20 pb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-red-400">
                  {t('settings.dangerZoneWb')}
                </h3>
              </div>
              <p className="text-[10px] sm:text-xs text-red-400/80 leading-relaxed font-medium">
                {t('settings.dangerZoneWbDesc')}
              </p>
              <button
                onClick={handleResetWbData}
                className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('settings.dangerZoneWbBtn')}</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
