import React, { useState } from 'react';
import { Settings, Sliders, Keyboard, Gamepad2, Globe, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';
import { useSettings } from '../modules/typing-practice/stores/settingsStore';
import { useProgress } from '../modules/typing-practice/stores/progressStore';

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

export const UnifiedSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'typing' | 'battle'>('general');
  const [tpSettings, setTpSettings] = useSettings();
  const { resetProgress: resetTpProgress } = useProgress();

  // Word Battle Settings
  const [wbSettings, setWbSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('typing_adventure_wb_settings');
    if (saved) {
      try {
        return { ...DEFAULT_WB_SETTINGS, ...JSON.parse(saved) };
      } catch {
        // ignore
      }
    }
    return DEFAULT_WB_SETTINGS;
  });

  const updateWbSettings = (updater: Partial<GameSettings>) => {
    const updated = { ...wbSettings, ...updater };
    setWbSettings(updated);
    localStorage.setItem('typing_adventure_wb_settings', JSON.stringify(updated));
    
    // Apply theme changes if general theme is changed
    if (updater.theme) {
      document.body.setAttribute('data-theme', updater.theme);
    }
  };

  const updateWbTypingCoach = (updater: Partial<GameSettings['typingCoach']>) => {
    const updatedCoach = { ...wbSettings.typingCoach, ...updater };
    const updated = { ...wbSettings, typingCoach: updatedCoach };
    setWbSettings(updated);
    localStorage.setItem('typing_adventure_wb_settings', JSON.stringify(updated));
  };

  const handleResetWbData = () => {
    if (confirm('Bạn có chắc muốn xóa sạch toàn bộ kỷ lục, từ vựng và số liệu ôn tập của Game Bắn Chữ?')) {
      localStorage.removeItem('typing_adventure_wb_word_stats');
      localStorage.removeItem('typing_adventure_wb_lifetime_stats');
      localStorage.removeItem('typing_adventure_wb_custom_lists');
      localStorage.removeItem('typing_adventure_wb_training_mode');
      alert('Đã xóa sạch dữ liệu Game Bắn Chữ.');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-10 select-none flex flex-col gap-6">
      
      {/* Title */}
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-3xl font-black text-white flex items-center justify-center gap-2 font-display uppercase tracking-wider drop-shadow-[0_0_8px_rgba(0,242,255,0.3)]">
          <Settings className="w-7 h-7 text-cyber-accent" />
          Cài đặt toàn bộ hệ thống
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 font-medium">
          Tùy chỉnh ngôn ngữ, cấu hình bài luyện gõ phím và hiệu năng trò chơi bắn chữ.
        </p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-outline-variant/30 gap-1 sm:gap-2">
        {[
          { id: 'general', label: 'Cài Đặt Chung', icon: Globe },
          { id: 'typing', label: 'Luyện Gõ (TypeMaster)', icon: Keyboard },
          { id: 'battle', label: 'Bắn Chữ (Word Battle)', icon: Gamepad2 },
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
                  Ngôn ngữ hiển thị (UI Language)
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'vi', name: '🇻🇳 Tiếng Việt', desc: 'Mặc định' },
                  { id: 'en', name: '🇺🇸 English', desc: 'English interface' },
                  { id: 'ja', name: '🇯🇵 日本語', desc: '日本語インターフェース' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => updateWbSettings({ uiLanguage: lang.id as any })}
                    className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      wbSettings.uiLanguage === lang.id
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
                  Giao diện chính (Theme)
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'cyberpunk', name: '🌌 Cyberpunk (👦)', desc: 'Neon hiện đại & cá tính' },
                  { id: 'magical', name: '💖 Magical (👧)', desc: 'Màu sắc tươi sáng, dễ thương' },
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
                    <span className="text-sm">{theme.name}</span>
                    <span className="text-[10px] opacity-75">{theme.desc}</span>
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
                  Cấu hình luyện ngón
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                
                {/* Audio Switch */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cyber-dark/30 border border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-gray-200">Âm thanh gõ phím</span>
                    <span className="text-[10px] text-gray-400">Phát âm thanh click phím của TypeMaster</span>
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
                    <span className="text-xs sm:text-sm font-bold text-gray-200">Bàn tay động (Hand Guide)</span>
                    <span className="text-[10px] text-gray-400">Hiển thị ngón tay ảo hướng dẫn gõ đúng vị trí</span>
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
                    <span className="text-xs sm:text-sm font-bold text-gray-200">Cho phép dùng phím [Backspace]</span>
                    <span className="text-[10px] text-gray-400">Cho phép xóa các chữ gõ sai để gõ lại</span>
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
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cỡ chữ văn bản tập gõ</span>
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
                        {size === 'sm' && 'Nhỏ'}
                        {size === 'md' && 'Vừa'}
                        {size === 'lg' && 'Lớn'}
                        {size === 'xl' && 'Rất lớn'}
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
                  Xóa dữ liệu luyện gõ
                </h3>
              </div>
              <p className="text-[10px] sm:text-xs text-red-400/80 leading-relaxed font-medium">
                Hành động này sẽ xóa vĩnh viễn toàn bộ bài học luyện gõ đã hoàn thành, heatmap phím lỗi và số liệu thống kê. Không thể đảo ngược!
              </p>
              <button
                onClick={() => {
                  if (confirm('Bạn có hoàn toàn chắc chắn muốn xóa sạch dữ liệu tiến trình học luyện gõ phím?')) {
                    resetTpProgress();
                    alert('Đã xóa dữ liệu luyện gõ.');
                  }
                }}
                className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset vĩnh viễn dữ liệu luyện gõ</span>
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
                  Cấu hình tốc độ bay & Hiển thị
                </h3>
              </div>

              <div className="flex flex-col gap-4">
                
                {/* Aircraft Speed */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-300">
                    <span>Tốc độ rơi của máy bay (Chữ tiếng Anh)</span>
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
                    <span>Chậm (Dễ)</span>
                    <span>Chuẩn (1.0x)</span>
                    <span>Nhanh (Khó)</span>
                  </div>
                </div>

                {/* Meaning Fade Speed */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-300">
                    <span>Tốc độ mờ của nghĩa từ gợi ý</span>
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
                    <span>Chậm gợi ý</span>
                    <span>Nhanh gợi ý</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Typing Coach Options */}
            <div className="glass-panel p-5 rounded-3xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-2">
                <Keyboard className="w-4 h-4 text-cyber-accent" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-primary-container">
                  Hệ thống Typing Coach (Gợi ý phím game)
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                
                {/* Virtual Keyboard */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-cyber-dark/30 border border-outline-variant/10">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-gray-200">Hiển thị Bàn phím ảo trong game</span>
                    <span className="text-[10px] text-gray-400">Hiện vị trí phím ảo gợi ý ở góc màn hình</span>
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
                    <span className="text-xs sm:text-sm font-bold text-gray-200">Gợi ý màu ngón tay (Finger Guide)</span>
                    <span className="text-[10px] text-gray-400">Tô màu ngón tay ảo cần nhấn phím</span>
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
                  Xóa dữ liệu game Word Battle
                </h3>
              </div>
              <p className="text-[10px] sm:text-xs text-red-400/80 leading-relaxed font-medium">
                Xóa sạch các bộ từ vựng tự tạo, file Excel/CSV đã import, chỉ số thuộc lòng SRS và lịch sử điểm số của Game Bắn Chữ.
              </p>
              <button
                onClick={handleResetWbData}
                className="w-full flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset vĩnh viễn dữ liệu Word Battle</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
