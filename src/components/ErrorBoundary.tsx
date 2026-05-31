import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useAppLanguage } from '../i18n/LanguageProvider';

interface Props {
  children: ReactNode;
  module?: 'typing-practice' | 'word-battle';
  t: (key: string) => string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Typing4English:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetData = () => {
    const confirmReset = window.confirm(this.props.t('errors.confirmReset'));

    if (confirmReset) {
      if (this.props.module === 'typing-practice') {
        localStorage.removeItem('typing_adventure_typing_settings');
        localStorage.removeItem('typing_adventure_typing_progress');
      } else {
        localStorage.removeItem('typing_adventure_wb_settings');
        localStorage.removeItem('typing_adventure_wb_custom_lists');
        localStorage.removeItem('typing_adventure_wb_word_stats');
        localStorage.removeItem('typing_adventure_wb_lifetime_stats');
        localStorage.removeItem('typing_adventure_wb_training_mode');
        localStorage.removeItem('typing_adventure_wb_sound');
      }
      alert(this.props.t('errors.resetDone'));
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const { t } = this.props;

      return (
        <div className="min-screen w-screen bg-cyber-bg flex flex-col justify-center items-center p-6 text-gray-300 font-mono select-text relative overflow-hidden min-h-screen">
          {/* Cyber animated grid lines */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-magenta/5 to-transparent pointer-events-none z-0" />
          
          <div className="glass-panel max-w-xl w-full p-8 rounded-3xl border-2 border-cyber-magenta shadow-neon-magenta text-center relative z-10 animate-float">
            <AlertTriangle className="w-16 h-16 text-cyber-magenta mx-auto mb-4 animate-pulse filter drop-shadow-[0_0_10px_#ff0055]" />
            
            <h1 className="text-2xl md:text-3xl font-black font-display text-white tracking-wider uppercase mb-2">
              {t('errors.title')}
            </h1>
            
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              {t('errors.desc')}
            </p>

            {this.state.error && (
              <div className="bg-cyber-dark/80 border border-cyber-magenta/25 rounded-2xl p-4 text-left mb-6 overflow-x-auto max-h-[140px] custom-scrollbar text-[10px]">
                <div className="font-extrabold text-cyber-magenta uppercase mb-1">{t('errors.errorTitle')}</div>
                <div className="text-white break-words">{this.state.error.toString()}</div>
                {this.state.error.stack && (
                  <pre className="text-gray-500 mt-2 font-mono leading-tight whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 bg-gradient-to-r from-cyber-accent to-cyber-indigo text-white font-extrabold rounded-xl uppercase tracking-wider shadow-neon-cyan hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs border border-cyber-accent/30"
              >
                <RotateCcw className="w-4 h-4" /> {t('errors.reloadBtn')}
              </button>
              
              <button
                onClick={this.handleResetData}
                className="flex-1 py-3 bg-red-950/20 hover:bg-red-500/20 border border-red-500/30 text-cyber-magenta font-extrabold rounded-xl uppercase tracking-wider hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                <AlertTriangle className="w-4 h-4" /> {t('errors.resetBtn')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary(props: { children: ReactNode; module?: 'typing-practice' | 'word-battle' }) {
  const { t } = useAppLanguage();
  return <ErrorBoundaryInner t={t} {...props} />;
}
