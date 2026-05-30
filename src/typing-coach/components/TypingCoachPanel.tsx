import React, { useState } from 'react';
import type { TypingCoachSettings, UILanguage, SoundSettings } from '../../types/game';
import { useTranslation } from '../../i18n/useTranslation';
import { useTypingCoach } from '../hooks/useTypingCoach';
import { VirtualKeyboard } from './VirtualKeyboard';
import { FingerGuide } from './FingerGuide';
import { KeyboardHandsOverlay } from './KeyboardHandsOverlay';
import { Target, HelpCircle, AlertCircle, Sliders } from 'lucide-react';

interface TypingCoachPanelProps {
  activeWord: string | null;
  progress: number;
  settings: TypingCoachSettings;
  uiLanguage: UILanguage;
  onUpdateSettings?: (settings: Partial<TypingCoachSettings>) => void;
  soundSettings?: SoundSettings;
  onTogglePronounce?: () => void;
  onSetPronunciationAccent?: (accent: 'us' | 'uk') => void;
}

export const TypingCoachPanel: React.FC<TypingCoachPanelProps> = React.memo(({
  activeWord,
  progress,
  settings,
  uiLanguage,
  onUpdateSettings,
  soundSettings,
  onTogglePronounce,
  onSetPronunciationAccent,
}) => {
  const t = useTranslation(uiLanguage);

  const [showInstructions, setShowInstructions] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('typing_combat_coach_show_instructions');
      return saved !== 'false'; // default is true
    } catch {
      return true;
    }
  });

  const [showPanelSettings, setShowPanelSettings] = useState<boolean>(false);

  const toggleInstructions = () => {
    const nextVal = !showInstructions;
    setShowInstructions(nextVal);
    try {
      localStorage.setItem('typing_combat_coach_show_instructions', String(nextVal));
    } catch {
      // ignore
    }
  };

  const {
    currentKey,
    currentFinger,
    typedPart,
    remainingPart,
    isSupportedKey,
  } = useTypingCoach({ activeWord, progress, settings });

  if (!settings.enabled) return null;

  // 1. Resolve smart overlay modes dynamically
  const activeOverlayMode = 
    settings.overlayMode === 'auto'
      ? activeWord ? 'ghost' : 'translucent'
      : settings.overlayMode;

  const overlayClass = 
    activeOverlayMode === 'ghost'
      ? 'bg-transparent border-transparent pointer-events-none shadow-none backdrop-blur-none select-none opacity-80'
      : activeOverlayMode === 'translucent'
        ? 'bg-cyber-dark/25 border-cyber-accent/10 backdrop-blur-sm shadow-md'
        : 'bg-cyber-glass border-cyber-accent/15 backdrop-blur-md shadow-lg'; // solid

  // Pointer events: ghost mode allows clicking straight through to the gameplay field
  const pointerEventsClass = activeOverlayMode === 'ghost' ? 'pointer-events-none' : 'pointer-events-auto';

  // Position container styling classes
  const layoutClass = 
    settings.position === 'right'
      ? `fixed right-4 top-24 bottom-24 z-45 w-[320px] flex flex-col items-center gap-4 rounded-3xl p-5 border overflow-y-auto custom-scrollbar ${pointerEventsClass} ${overlayClass}`
      : settings.position === 'compact'
        ? `fixed bottom-4 right-4 z-45 w-[300px] flex flex-col items-center gap-3 rounded-2xl p-4 border ${pointerEventsClass} ${overlayClass}`
        : `fixed bottom-4 left-1/2 -translate-x-1/2 z-45 w-[95%] max-w-[980px] flex flex-col items-center gap-3 rounded-3xl p-4 border ${pointerEventsClass} ${overlayClass}`; // Default: Bottom layout (centered & maximum width set to 980px to align perfectly with the scaled down keyboard)

  // Inline styling for the next target letter prompt box
  const renderNextKeyBox = () => {
    if (!currentKey) return null;

    return (
      <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-cyber-dark/60 border border-cyber-accent/20 text-center min-w-[70px] h-16 shrink-0 relative overflow-hidden">
        <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wider mb-0.5">{t('nextKey')}</span>
        <span className="text-2xl font-black text-cyber-accent neon-text-cyan uppercase leading-none">
          {currentKey === ' ' ? '␣' : currentKey}
        </span>
      </div>
    );
  };

  // Force using the unified KeyboardHandsOverlay when not in compact mode
  // to ensure that the hand illustrations are placed directly on top of the keyboard keys.
  const renderHandsOverlay = settings.position !== 'compact';

  // 1. Separate render branch for Bottom layout position to stack instructions below the keyboard
  if (settings.position === 'bottom') {
    return (
      <div className={`${layoutClass} animate-fade-in`}>
        {/* 1. Keyboard+Hands Overlay (main central element) */}
        <div 
          className="w-full flex justify-center transition-all duration-200"
          style={{ opacity: (settings.keyboardOpacity ?? 85) / 100 }}
        >
          {renderHandsOverlay ? (
            <KeyboardHandsOverlay
              currentKey={currentKey}
              currentFinger={currentFinger}
              showHomeRowHint={settings.showHomeRowHint}
              animationEnabled={settings.animationEnabled}
              keyboardSize={settings.keyboardSize ?? 100}
            />
          ) : (
            settings.showVirtualKeyboard && (
              <VirtualKeyboard
                currentKey={currentKey}
                showHomeRowHint={settings.showHomeRowHint}
              />
            )
          )}
        </div>

        {/* 2. Bottom Row containing Instructions/Target progress and Next Key Box */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full border-t border-cyber-accent/10 pt-3 px-3">
          {/* Left placeholder to balance the NextKeyBox on the right, ensuring perfect centering */}
          {settings.showNextKeyHint && activeWord && (
            <div className="hidden md:block w-[70px] h-16 flex-shrink-0 opacity-0 pointer-events-none" />
          )}

          {/* Target Progress / Instructions box */}
          <div className="w-full max-w-2xl">
            {showInstructions ? (
              <div className="flex flex-col gap-1.5 w-full p-3 bg-cyber-dark/40 border border-cyber-accent/10 rounded-2xl relative text-center items-center">
                <div className="flex items-center justify-between border-b border-cyber-accent/10 pb-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-cyber-accent" />
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                      {activeWord ? t('currentTarget') : 'Touch Typing Coach'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPanelSettings(prev => !prev)}
                      className={`text-[9px] px-1.5 py-0.5 rounded border transition-all cursor-pointer flex items-center gap-1 ${
                        showPanelSettings 
                          ? 'text-cyber-accent border-cyber-accent bg-cyber-accent/10 font-bold'
                          : 'text-gray-400 border-cyber-accent/20 hover:border-cyber-accent bg-cyber-dark/30 hover:bg-cyber-accent/10'
                      }`}
                    >
                      <Sliders className="w-2.5 h-2.5" />
                      <span>{uiLanguage === 'vi' ? 'Cấu Hình' : uiLanguage === 'ja' ? 'キーボード設定' : 'Settings'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleInstructions}
                      className="text-[9px] text-gray-400 hover:text-cyber-accent px-1.5 py-0.5 rounded border border-cyber-accent/20 hover:border-cyber-accent/60 bg-cyber-dark/30 hover:bg-cyber-accent/10 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{uiLanguage === 'vi' ? 'Ẩn Hướng Dẫn' : uiLanguage === 'ja' ? '説明を隠す' : 'Hide Guide'}</span>
                    </button>
                  </div>
                </div>

                {showPanelSettings ? (
                  <div className="flex flex-col gap-3 w-full p-2.5 bg-cyber-dark/50 border border-cyber-accent/15 rounded-xl mt-1.5 animate-fade-in text-left">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] text-gray-300 font-mono">
                        <span>{uiLanguage === 'vi' ? 'Kích thước bàn phím:' : uiLanguage === 'ja' ? 'キーボードサイズ:' : 'Keyboard Size:'}</span>
                        <span className="text-cyber-accent font-bold">{(settings.keyboardSize ?? 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="140"
                        value={settings.keyboardSize ?? 100}
                        onChange={(e) => onUpdateSettings?.({ keyboardSize: Number(e.target.value) })}
                        className="w-full h-1 bg-cyber-dark rounded-lg appearance-none cursor-pointer accent-cyber-accent border border-cyber-accent/15"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[9px] text-gray-300 font-mono">
                        <span>{uiLanguage === 'vi' ? 'Độ mờ bàn phím:' : uiLanguage === 'ja' ? 'キーボード透明 độ:' : 'Keyboard Opacity:'}</span>
                        <span className="text-cyber-accent font-bold">{(settings.keyboardOpacity ?? 85)}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={settings.keyboardOpacity ?? 85}
                        onChange={(e) => onUpdateSettings?.({ keyboardOpacity: Number(e.target.value) })}
                        className="w-full h-1 bg-cyber-dark rounded-lg appearance-none cursor-pointer accent-cyber-accent border border-cyber-accent/15"
                      />
                    </div>

                    {/* Word Pronunciation Toggle & Accent Selection */}
                    {soundSettings && (
                      <div className="pt-2 border-t border-cyber-accent/15 flex flex-col gap-2 mt-1 w-full text-left">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-mono text-[9px] text-gray-300">
                            {uiLanguage === 'vi' ? 'Phát âm khi bắn hạ:' : uiLanguage === 'ja' ? '破壊時の発音:' : 'Pronounce:'}
                          </span>
                          <button 
                            type="button" 
                            onClick={onTogglePronounce} 
                            className={`border font-mono text-[9px] px-2 py-0.5 rounded uppercase hover:bg-cyber-accent/10 transition-colors cursor-pointer ${
                              soundSettings.pronounceOnDestroy ? 'border-cyber-accent text-cyber-accent bg-cyber-accent/10 font-bold' : 'border-cyber-accent/20 text-gray-400'
                            }`}
                          >
                            {soundSettings.pronounceOnDestroy 
                              ? (uiLanguage === 'vi' ? 'Bật' : uiLanguage === 'ja' ? '有効' : 'On') 
                              : (uiLanguage === 'vi' ? 'Tắt' : uiLanguage === 'ja' ? '無効' : 'Off')
                            }
                          </button>
                        </div>

                        {soundSettings.pronounceOnDestroy && (
                          <div className="flex justify-between items-center w-full animate-fade-in">
                            <span className="font-mono text-[9px] text-gray-400">
                              {uiLanguage === 'vi' ? 'Giọng đọc:' : uiLanguage === 'ja' ? 'アクセント:' : 'Accent:'}
                            </span>
                            <div className="flex gap-1">
                              {[
                                { label: 'US', val: 'us' },
                                { label: 'UK', val: 'uk' },
                              ].map(acc => {
                                const isActive = (soundSettings.pronunciationAccent ?? 'us') === acc.val;
                                return (
                                  <button
                                    key={acc.val}
                                    type="button"
                                    onClick={() => onSetPronunciationAccent?.(acc.val as 'us' | 'uk')}
                                    className={`text-[9px] font-mono rounded px-1.5 py-0.5 transition-all cursor-pointer border ${
                                      isActive 
                                        ? 'text-cyber-accent border-cyber-accent bg-cyber-accent/10 font-bold' 
                                        : 'text-gray-400 border-cyber-accent/20 hover:bg-cyber-accent/10'
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
                    )}
                  </div>
                ) : activeWord ? (
                  <div className="flex flex-col gap-1 mt-1 text-center items-center">
                    <div className="text-sm md:text-base font-black tracking-widest uppercase truncate leading-tight text-center">
                      <span className="text-cyber-green neon-text-green">{typedPart}</span>
                      <span className="text-white border-b-2 border-cyber-accent animate-pulse">{remainingPart[0]}</span>
                      <span className="text-gray-500">{remainingPart.slice(1)}</span>
                    </div>
                    {!isSupportedKey && (
                      <div className="flex items-center justify-center gap-1 text-[9px] text-cyber-magenta/80 leading-normal animate-pulse w-full">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('unsupportedKeyHint')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 font-mono text-[9px] text-gray-400 leading-normal mt-1 text-center items-center justify-center">
                    <span className="text-cyber-accent font-bold uppercase tracking-wider">{t('typeFirstLetterHint')}</span>
                    {settings.showHomeRowHint && (
                      <span className="opacity-75 flex items-center justify-center gap-1">
                        <HelpCircle className="w-3 h-3 shrink-0" />
                        {t('homeRowHint')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex justify-center w-full">
                <button
                  type="button"
                  onClick={toggleInstructions}
                  className="px-4 py-1.5 bg-cyber-accent/10 hover:bg-cyber-accent/25 border border-cyber-accent/20 hover:border-cyber-accent text-cyber-accent hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5 animate-bounce" />
                  {uiLanguage === 'vi' ? 'Hiện Hướng Dẫn Luyện Gõ' : uiLanguage === 'ja' ? 'タイピングガイドを表示' : 'Show Typing Guide'}
                </button>
              </div>
            )}
          </div>

          {/* Next target key prompt */}
          {settings.showNextKeyHint && activeWord && (
            <div className="flex-shrink-0">
              {renderNextKeyBox()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Standard layout branch for side positions (compact or right)
  return (
    <div className={`${layoutClass} animate-fade-in`}>
      {/* 1. Target word spelling progress box */}
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between border-b border-cyber-accent/10 pb-1">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyber-accent" />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              {activeWord ? t('currentTarget') : 'Touch Typing Coach'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowPanelSettings(prev => !prev)}
            className={`text-[9px] p-1 rounded border transition-all cursor-pointer flex items-center justify-center ${
              showPanelSettings 
                ? 'text-cyber-accent border-cyber-accent bg-cyber-accent/10'
                : 'text-gray-400 border-cyber-accent/20 hover:border-cyber-accent bg-cyber-dark/30 hover:bg-cyber-accent/10'
            }`}
            title={uiLanguage === 'vi' ? 'Cấu Hình' : uiLanguage === 'ja' ? 'キーボード設定' : 'Settings'}
          >
            <Sliders className="w-3 h-3" />
          </button>
        </div>

        {showPanelSettings ? (
          <div className="flex flex-col gap-3 w-full p-2 bg-cyber-dark/50 border border-cyber-accent/15 rounded-xl mt-1 animate-fade-in text-left">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] text-gray-300 font-mono">
                <span>{uiLanguage === 'vi' ? 'Kích thước:' : uiLanguage === 'ja' ? 'サイズ:' : 'Size:'}</span>
                <span className="text-cyber-accent font-bold">{(settings.keyboardSize ?? 100)}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="140"
                value={settings.keyboardSize ?? 100}
                onChange={(e) => onUpdateSettings?.({ keyboardSize: Number(e.target.value) })}
                className="w-full h-1 bg-cyber-dark rounded-lg appearance-none cursor-pointer accent-cyber-accent border border-cyber-accent/15"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[9px] text-gray-300 font-mono">
                <span>{uiLanguage === 'vi' ? 'Độ mờ:' : uiLanguage === 'ja' ? '透明度:' : 'Opacity:'}</span>
                <span className="text-cyber-accent font-bold">{(settings.keyboardOpacity ?? 85)}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={settings.keyboardOpacity ?? 85}
                onChange={(e) => onUpdateSettings?.({ keyboardOpacity: Number(e.target.value) })}
                className="w-full h-1 bg-cyber-dark rounded-lg appearance-none cursor-pointer accent-cyber-accent border border-cyber-accent/15"
              />
            </div>

            {/* Word Pronunciation Toggle & Accent Selection */}
            {soundSettings && (
              <div className="pt-2 border-t border-cyber-accent/15 flex flex-col gap-2 mt-1 w-full text-left">
                <div className="flex justify-between items-center w-full">
                  <span className="font-mono text-[9px] text-gray-300">
                    {uiLanguage === 'vi' ? 'Phát âm:' : uiLanguage === 'ja' ? '発音:' : 'Pronounce:'}
                  </span>
                  <button 
                    type="button" 
                    onClick={onTogglePronounce} 
                    className={`border font-mono text-[9px] px-1.5 py-0.5 rounded uppercase hover:bg-cyber-accent/10 transition-colors cursor-pointer ${
                      soundSettings.pronounceOnDestroy ? 'border-cyber-accent text-cyber-accent bg-cyber-accent/10 font-bold' : 'border-cyber-accent/20 text-gray-400'
                    }`}
                  >
                    {soundSettings.pronounceOnDestroy 
                      ? (uiLanguage === 'vi' ? 'Bật' : uiLanguage === 'ja' ? '有効' : 'On') 
                      : (uiLanguage === 'vi' ? 'Tắt' : uiLanguage === 'ja' ? '無効' : 'Off')
                    }
                  </button>
                </div>

                {soundSettings.pronounceOnDestroy && (
                  <div className="flex justify-between items-center w-full animate-fade-in">
                    <span className="font-mono text-[9px] text-gray-400">
                      {uiLanguage === 'vi' ? 'Giọng:' : uiLanguage === 'ja' ? 'アクセント:' : 'Accent:'}
                    </span>
                    <div className="flex gap-1">
                      {[
                        { label: 'US', val: 'us' },
                        { label: 'UK', val: 'uk' },
                      ].map(acc => {
                        const isActive = (soundSettings.pronunciationAccent ?? 'us') === acc.val;
                        return (
                          <button
                            key={acc.val}
                            type="button"
                            onClick={() => onSetPronunciationAccent?.(acc.val as 'us' | 'uk')}
                            className={`text-[9px] font-mono rounded px-1 py-0.5 transition-all cursor-pointer border ${
                              isActive 
                                ? 'text-cyber-accent border-cyber-accent bg-cyber-accent/10 font-bold' 
                                : 'text-gray-400 border-cyber-accent/20 hover:bg-cyber-accent/10'
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
            )}
          </div>
        ) : activeWord ? (
          <div className="flex flex-col gap-1">
            <div className="text-base font-black tracking-widest uppercase truncate leading-tight">
              <span className="text-cyber-green neon-text-green">{typedPart}</span>
              <span className="text-white border-b-2 border-cyber-accent animate-pulse">{remainingPart[0]}</span>
              <span className="text-gray-500">{remainingPart.slice(1)}</span>
            </div>
            {!isSupportedKey && (
              <div className="flex items-start gap-1 text-[9px] text-cyber-magenta/80 leading-normal animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{t('unsupportedKeyHint')}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1 font-mono text-[9px] text-gray-400 leading-normal">
            <span className="text-cyber-accent font-bold uppercase tracking-wider">{t('typeFirstLetterHint')}</span>
            {settings.showHomeRowHint && (
              <span className="opacity-75 flex items-start gap-1">
                <HelpCircle className="w-3 h-3 shrink-0 mt-0.5" />
                {t('homeRowHint')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Visual hand guides (render separately only if hands overlay is NOT active) */}
      {settings.showFingerGuide && !renderHandsOverlay && (
        <FingerGuide
          currentFinger={currentFinger}
          animationEnabled={settings.animationEnabled}
          uiLanguage={uiLanguage}
          currentKey={currentKey}
        />
      )}

      {/* 3. Next target key prompt */}
      {settings.showNextKeyHint && activeWord && renderNextKeyBox()}

      {/* 4. Unified Keyboard+Hands Overlay */}
      <div 
        className="w-full flex justify-center transition-all duration-200"
        style={{ opacity: (settings.keyboardOpacity ?? 85) / 100 }}
      >
        {renderHandsOverlay ? (
          <KeyboardHandsOverlay
            currentKey={currentKey}
            currentFinger={currentFinger}
            showHomeRowHint={settings.showHomeRowHint}
            animationEnabled={settings.animationEnabled}
            keyboardSize={settings.keyboardSize ?? 100}
          />
        ) : (
          settings.showVirtualKeyboard && settings.position !== 'compact' && (
            <VirtualKeyboard
              currentKey={currentKey}
              showHomeRowHint={settings.showHomeRowHint}
            />
          )
        )}
      </div>
    </div>
  );
});

TypingCoachPanel.displayName = 'TypingCoachPanel';

