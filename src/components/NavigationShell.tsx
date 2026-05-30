import React from 'react';
import { Home, Keyboard, Gamepad2, Settings, Sparkles } from 'lucide-react';

interface NavigationShellProps {
  currentMode: 'home' | 'typing-practice' | 'word-battle' | 'settings';
  onSelectMode: (mode: 'home' | 'typing-practice' | 'word-battle' | 'settings') => void;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({ currentMode, onSelectMode }) => {
  return (
    <header className="bg-surface-container/60 backdrop-blur-xl border-b border-outline-variant w-full px-4 sm:px-8 py-3 flex justify-between items-center z-50 flex-shrink-0 sticky top-0 shadow-lg select-none">
      
      {/* Brand Logo & Name */}
      <div 
        onClick={() => onSelectMode('home')}
        className="flex items-center gap-2 cursor-pointer transition-transform active:scale-95 group"
      >
        <div className="p-2 rounded-xl bg-gradient-to-tr from-cyber-accent to-cyber-magenta text-white shadow-md group-hover:scale-105 transition-transform flex items-center justify-center">
          <Keyboard className="w-5 h-5 text-white" />
        </div>
        <span className="font-display font-black text-base sm:text-xl tracking-tight text-white group-hover:neon-text-cyan transition-all">
          Typing<span className="text-cyber-accent group-hover:text-cyber-magenta transition-colors">4English</span>
        </span>
      </div>

      {/* Responsive Navigation Pill Bar */}
      <nav className="flex items-center gap-1.5 sm:gap-2 bg-background/50 border border-outline-variant/30 px-2 py-1 rounded-full shadow-inner">
        {[
          { id: 'home', label: 'Home', icon: Home, color: 'text-cyber-accent' },
          { id: 'typing-practice', label: 'Luyện Gõ', icon: Keyboard, color: 'text-cyber-accent' },
          { id: 'word-battle', label: 'Bắn Chữ', icon: Gamepad2, color: 'text-cyber-magenta' },
          { id: 'settings', label: 'Cài Đặt', icon: Settings, color: 'text-secondary-fixed-dim' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentMode === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSelectMode(item.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyber-accent/15 to-cyber-magenta/15 border border-cyber-accent/30 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? item.color : 'text-gray-400'}`} />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Decorative Subtle Right Indicator */}
      <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-500 font-mono tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-cyber-accent animate-pulse" />
        <span>POWERED BY ANTIGRAVITY</span>
      </div>

    </header>
  );
};
