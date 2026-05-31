import React from 'react';
import { Home, Keyboard, Gamepad2, Settings, Sparkles } from 'lucide-react';

interface NavigationShellProps {
  currentMode: 'home' | 'typing-practice' | 'word-battle' | 'settings';
  onSelectMode: (mode: 'home' | 'typing-practice' | 'word-battle' | 'settings') => void;
  appTheme?: 'cyberpunk' | 'magical';
}

export const NavigationShell: React.FC<NavigationShellProps> = ({ currentMode, onSelectMode, appTheme = 'cyberpunk' }) => {
  const isMagical = appTheme === 'magical';

  return (
    <header className={`w-full px-4 sm:px-8 py-3 flex justify-between items-center z-50 flex-shrink-0 sticky top-0 backdrop-blur-xl shadow-lg select-none transition-all duration-300 ${
      isMagical 
        ? 'bg-white/85 border-b border-pink-100/60 shadow-pink-100/10' 
        : 'bg-surface-container/60 border-b border-outline-variant'
    }`}>
      
      {/* Brand Logo & Name */}
      <div 
        onClick={() => onSelectMode('home')}
        className="flex items-center gap-2 cursor-pointer transition-transform active:scale-95 group"
      >
        <div className={`p-2 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform flex items-center justify-center ${
          isMagical 
            ? 'bg-gradient-to-tr from-pink-400 to-purple-400' 
            : 'bg-gradient-to-tr from-cyber-accent to-cyber-magenta'
        }`}>
          <Keyboard className="w-5 h-5 text-white" />
        </div>
        <span className={`font-display font-black text-base sm:text-xl tracking-tight group-hover:scale-[1.01] transition-all ${
          isMagical ? 'text-slate-800' : 'text-white group-hover:neon-text-cyan'
        }`}>
          Typing<span className={`${isMagical ? 'text-pink-500' : 'text-cyber-accent group-hover:text-cyber-magenta'} transition-colors`}>4English</span>
        </span>
      </div>

      {/* Responsive Navigation Pill Bar */}
      <nav className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-full shadow-inner border ${
        isMagical 
          ? 'bg-pink-50/50 border-pink-100/60' 
          : 'bg-background/50 border-outline-variant/30'
      }`}>
        {[
          { id: 'home', label: 'Home', icon: Home, cyberColor: 'text-cyber-accent', magicalColor: 'text-pink-500' },
          { id: 'typing-practice', label: 'Luyện Gõ', icon: Keyboard, cyberColor: 'text-cyber-accent', magicalColor: 'text-pink-500' },
          { id: 'word-battle', label: 'Bắn Chữ', icon: Gamepad2, cyberColor: 'text-cyber-magenta', magicalColor: 'text-purple-500' },
          { id: 'settings', label: 'Cài Đặt', icon: Settings, cyberColor: 'text-secondary-fixed-dim', magicalColor: 'text-slate-500' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentMode === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSelectMode(item.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? isMagical
                    ? 'bg-pink-100/80 border border-pink-200/50 text-pink-600 shadow-sm font-extrabold'
                    : 'bg-gradient-to-r from-cyber-accent/15 to-cyber-magenta/15 border border-cyber-accent/30 text-white shadow-sm'
                  : isMagical
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-pink-50/30 border border-transparent'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? (isMagical ? item.magicalColor : item.cyberColor) : 'text-gray-400'}`} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Decorative Subtle Right Indicator */}
      <div className={`hidden md:flex items-center gap-2 text-[10px] font-mono tracking-wider ${
        isMagical ? 'text-pink-400/80' : 'text-gray-500'
      }`}>
        <Sparkles className={`w-3.5 h-3.5 animate-pulse ${isMagical ? 'text-pink-400' : 'text-cyber-accent'}`} />
        <span>{isMagical ? 'TYPING ADVENTURE 🌟' : 'POWERED BY ANTIGRAVITY'}</span>
      </div>

    </header>
  );
};
