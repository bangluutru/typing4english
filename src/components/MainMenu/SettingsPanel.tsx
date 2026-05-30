import React from 'react';
import type { SoundSettings, GameSettings, UILanguage } from '../../types/game';
import { useTranslation } from '../../i18n/useTranslation';

interface SettingsPanelProps {
  uiLanguage: UILanguage;
  soundSettings: SoundSettings;
  gameSettings: GameSettings;
  onSetGameSettings: (settings: GameSettings) => void;
  onToggleSfx: () => void;
  onToggleMusic: () => void;
  onSetSfxVolume: (vol: number) => void;
  onSetMusicVolume: (vol: number) => void;
  onInitAudio: () => void;
  onTogglePronounce?: () => void;
  onSetPronunciationAccent?: (accent: 'us' | 'uk') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  uiLanguage,
  soundSettings,
  gameSettings,
  onSetGameSettings,
  onToggleSfx,
  onToggleMusic,
  onSetSfxVolume,
  onSetMusicVolume,
  onInitAudio,
  onTogglePronounce,
  onSetPronunciationAccent,
}) => {
  const t = useTranslation(uiLanguage);

  const handleSetSpeed = (val: number) => {
    onSetGameSettings({
      ...gameSettings,
      aircraftSpeedMultiplier: val,
    });
  };

  const handleSetFade = (val: number) => {
    onSetGameSettings({
      ...gameSettings,
      meaningFadeSpeedMultiplier: val,
    });
  };

  const handleSetMeaningFontSize = (val: number) => {
    onSetGameSettings({
      ...gameSettings,
      meaningFontSizeMultiplier: val,
    });
  };

  const handleToggleTypingCoach = () => {
    onInitAudio();
    onSetGameSettings({
      ...gameSettings,
      typingCoach: {
        ...gameSettings.typingCoach,
        enabled: !gameSettings.typingCoach.enabled,
      },
    });
  };

  return (
    <div className="glass-panel rounded-xl p-panel-padding flex flex-col gap-4 flex-grow overflow-y-auto custom-scrollbar">
      
      {/* Speed Controls */}
      <div className="space-y-4">
        {/* Flight Speed */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono-data text-[11px] text-primary uppercase">{t('gameSpeed')}</span>
            <span className="font-mono-data text-[10px] text-primary w-8 text-right">{gameSettings.aircraftSpeedMultiplier.toFixed(1)}x</span>
          </div>
          <div className="flex gap-1 mb-2">
            {[
              { label: uiLanguage === 'vi' ? 'Tập gõ 👶' : uiLanguage === 'ja' ? '練習 👶' : 'Beginner 👶', val: 0.3 },
              { label: t('speedSlow'), val: 0.7 },
              { label: t('speedNormal'), val: 1.0 },
              { label: t('speedFast'), val: 1.3 },
            ].map(sp => {
              const isActive = gameSettings.aircraftSpeedMultiplier === sp.val;
              return (
                <button
                  key={sp.val}
                  type="button"
                  onClick={() => { onInitAudio(); handleSetSpeed(sp.val); }}
                  className={`flex-1 text-[8px] font-mono-data rounded py-0.5 transition-all cursor-pointer ${
                    isActive 
                      ? 'text-primary-container border border-primary-container bg-primary-container/10 font-bold' 
                      : 'text-on-surface-variant border border-outline-variant hover:bg-surface-variant/30'
                  }`}
                >
                  {sp.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-grow h-1 bg-surface-variant rounded relative">
              <div className="absolute inset-y-0 left-0 bg-primary-container rounded-l" style={{ width: `${((gameSettings.aircraftSpeedMultiplier - 0.2) / 1.8) * 100}%` }}></div>
              <input 
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={gameSettings.aircraftSpeedMultiplier}
                onChange={(e) => handleSetSpeed(parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 z-10 cursor-pointer w-full"
              />
              <div className="absolute h-3 w-3 bg-primary-container rounded-full shadow-[0_0_5px_#00f2ff] top-1/2 -translate-y-1/2 -ml-1.5 pointer-events-none" style={{ left: `${((gameSettings.aircraftSpeedMultiplier - 0.2) / 1.8) * 100}%` }}></div>
            </div>
          </div>
        </div>
        
        {/* Fade Speed */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono-data text-[11px] text-primary uppercase">{t('meaningFadeSpeed')}</span>
            <span className="font-mono-data text-[10px] text-primary w-8 text-right">{gameSettings.meaningFadeSpeedMultiplier.toFixed(1)}x</span>
          </div>
          <div className="flex gap-1 mb-2">
            {[
              { label: t('speedSlow'), val: 0.6 },
              { label: t('speedNormal'), val: 1.0 },
              { label: t('speedFast'), val: 1.5 },
            ].map(f => {
              const isActive = gameSettings.meaningFadeSpeedMultiplier === f.val;
              return (
                <button
                  key={f.val}
                  type="button"
                  onClick={() => { onInitAudio(); handleSetFade(f.val); }}
                  className={`flex-1 text-[8px] font-mono-data rounded py-0.5 transition-all cursor-pointer ${
                    isActive 
                      ? 'text-primary-container border border-primary-container bg-primary-container/10 font-bold' 
                      : 'text-on-surface-variant border border-outline-variant hover:bg-surface-variant/30'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-grow h-1 bg-surface-variant rounded relative">
              <div className="absolute inset-y-0 left-0 bg-primary-container rounded-l" style={{ width: `${((gameSettings.meaningFadeSpeedMultiplier - 0.5) / 2.0) * 100}%` }}></div>
              <input 
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={gameSettings.meaningFadeSpeedMultiplier}
                onChange={(e) => handleSetFade(parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 z-10 cursor-pointer w-full"
              />
              <div className="absolute h-3 w-3 bg-primary-container rounded-full shadow-[0_0_5px_#00f2ff] top-1/2 -translate-y-1/2 -ml-1.5 pointer-events-none" style={{ left: `${((gameSettings.meaningFadeSpeedMultiplier - 0.5) / 2.0) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Floating Meaning Font Size */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono-data text-[11px] text-primary uppercase">{t('meaningFontSize')}</span>
            <span className="font-mono-data text-[10px] text-primary w-8 text-right">{gameSettings.meaningFontSizeMultiplier.toFixed(1)}x</span>
          </div>
          <div className="flex gap-1 mb-2">
            {[
              { label: t('sizeSmall'), val: 0.8 },
              { label: t('sizeMedium'), val: 1.0 },
              { label: t('sizeLarge'), val: 1.4 },
            ].map(sz => {
              const isActive = gameSettings.meaningFontSizeMultiplier === sz.val;
              return (
                <button
                  key={sz.val}
                  type="button"
                  onClick={() => { onInitAudio(); handleSetMeaningFontSize(sz.val); }}
                  className={`flex-1 text-[8px] font-mono-data rounded py-0.5 transition-all cursor-pointer ${
                    isActive 
                      ? 'text-primary-container border border-primary-container bg-primary-container/10 font-bold' 
                      : 'text-on-surface-variant border border-outline-variant hover:bg-surface-variant/30'
                  }`}
                >
                  {sz.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-grow h-1 bg-surface-variant rounded relative">
              <div className="absolute inset-y-0 left-0 bg-primary-container rounded-l" style={{ width: `${((gameSettings.meaningFontSizeMultiplier - 0.5) / 1.5) * 100}%` }}></div>
              <input 
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={gameSettings.meaningFontSizeMultiplier}
                onChange={(e) => handleSetMeaningFontSize(parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 z-10 cursor-pointer w-full"
              />
              <div className="absolute h-3 w-3 bg-primary-container rounded-full shadow-[0_0_5px_#00f2ff] top-1/2 -translate-y-1/2 -ml-1.5 pointer-events-none" style={{ left: `${((gameSettings.meaningFontSizeMultiplier - 0.5) / 1.5) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="space-y-4 pt-3 border-t border-outline-variant/50">
        {/* SFX */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono-data text-[11px] text-primary uppercase">{t('audioEnabled')}</span>
            <span className="font-mono-data text-[10px] text-primary w-8 text-right">{Math.round(soundSettings.sfxVolume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { onInitAudio(); onToggleSfx(); }} className="text-primary-container cursor-pointer">
              <span className="material-symbols-outlined text-primary-container text-[14px]">
                {soundSettings.sfxEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>
            <div className="flex-grow h-1.5 segmented-progress rounded relative">
              <div className="absolute inset-y-0 left-0 segmented-progress-active rounded-l" style={{ width: `${soundSettings.sfxVolume * 100}%` }}></div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundSettings.sfxVolume}
                onChange={(e) => onSetSfxVolume(parseFloat(e.target.value))}
                disabled={!soundSettings.sfxEnabled}
                className="absolute inset-0 opacity-0 z-10 cursor-pointer w-full"
              />
              <div className="absolute h-3 w-3 bg-primary-container rounded-full shadow-[0_0_10px_#00f2ff] top-1/2 -translate-y-1/2 -ml-1.5 pointer-events-none" style={{ left: `${soundSettings.sfxVolume * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* BGM */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono-data text-[11px] text-primary uppercase">{t('musicEnabled')}</span>
            <span className="font-mono-data text-[10px] text-primary w-8 text-right">{Math.round(soundSettings.musicVolume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { onInitAudio(); onToggleMusic(); }} className="text-primary-container cursor-pointer">
              <span className="material-symbols-outlined text-primary-container text-[14px]">
                {soundSettings.musicEnabled ? 'volume_up' : 'volume_off'}
              </span>
            </button>
            <div className="flex-grow h-1.5 segmented-progress rounded relative">
              <div className="absolute inset-y-0 left-0 segmented-progress-active rounded-l" style={{ width: `${soundSettings.musicVolume * 100}%` }}></div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={soundSettings.musicVolume}
                onChange={(e) => onSetMusicVolume(parseFloat(e.target.value))}
                disabled={!soundSettings.musicEnabled}
                className="absolute inset-0 opacity-0 z-10 cursor-pointer w-full"
              />
              <div className="absolute h-3 w-3 bg-primary-container rounded-full shadow-[0_0_10px_#00f2ff] top-1/2 -translate-y-1/2 -ml-1.5 pointer-events-none" style={{ left: `${soundSettings.musicVolume * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Word Pronunciation Toggle & Accent Selection */}
        <div className="pt-2 border-t border-outline-variant/35 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-mono-data text-[11px] text-primary uppercase">
              {uiLanguage === 'vi' ? 'Phát âm khi bắn hạ:' : uiLanguage === 'ja' ? '破壊時の発音:' : 'Pronounce on destroy:'}
            </span>
            <button 
              type="button" 
              onClick={() => { onInitAudio(); onTogglePronounce?.(); }} 
              className={`border font-mono-data text-[9px] px-2 py-0.5 rounded uppercase hover:bg-surface-variant/30 transition-colors cursor-pointer ${
                soundSettings.pronounceOnDestroy ? 'border-primary-container text-primary-container bg-primary-container/10 font-bold' : 'border-outline-variant text-on-surface-variant'
              }`}
            >
              {soundSettings.pronounceOnDestroy 
                ? (uiLanguage === 'vi' ? 'Bật' : uiLanguage === 'ja' ? '有効' : 'On') 
                : (uiLanguage === 'vi' ? 'Tắt' : uiLanguage === 'ja' ? '無効' : 'Off')
              }
            </button>
          </div>

          {soundSettings.pronounceOnDestroy && (
            <div className="flex justify-between items-center animate-fade-in">
              <span className="font-mono-data text-[10px] text-on-surface-variant/80">
                {uiLanguage === 'vi' ? 'Giọng đọc (Accent):' : uiLanguage === 'ja' ? 'アクセント:' : 'Accent:'}
              </span>
              <div className="flex gap-1">
                {[
                  { label: 'US (Mỹ)', val: 'us' },
                  { label: 'UK (Anh)', val: 'uk' },
                ].map(acc => {
                  const isActive = (soundSettings.pronunciationAccent ?? 'us') === acc.val;
                  return (
                    <button
                      key={acc.val}
                      type="button"
                      onClick={() => { onInitAudio(); onSetPronunciationAccent?.(acc.val as 'us' | 'uk'); }}
                      className={`text-[9px] font-mono-data rounded px-2 py-0.5 transition-all cursor-pointer border ${
                        isActive 
                          ? 'text-primary-container border-primary-container bg-primary-container/10 font-bold' 
                          : 'text-on-surface-variant border-outline-variant hover:bg-surface-variant/30'
                      }`}
                    >
                      {acc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Finger Training Toggle */}
      <div className="mt-auto border-t border-outline-variant pt-3 flex justify-between items-center flex-shrink-0">
        <div>
          <h4 className="font-mono-data text-[11px] text-primary-container uppercase font-bold tracking-wider">{t('typingCoach')}</h4>
        </div>
        <button 
          type="button"
          onClick={handleToggleTypingCoach}
          className={`border text-on-surface-variant font-mono-data text-[10px] px-3 py-1 rounded uppercase hover:bg-surface-variant/30 transition-colors cursor-pointer ${
            gameSettings.typingCoach.enabled ? 'border-primary-container text-primary-container bg-primary-container/10 font-bold' : 'border-outline-variant text-on-surface-variant'
          }`}
        >
          {gameSettings.typingCoach.enabled ? 'Active' : 'Inactive'}
        </button>
      </div>

    </div>
  );
};
