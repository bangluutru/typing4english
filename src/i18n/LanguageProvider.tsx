import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';
import type { UILanguage } from '../types/game';

interface LanguageContextProps {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<UILanguage>(() => {
    // 1. Read typing_adventure_ui_language
    const saved = localStorage.getItem('typing_adventure_ui_language') as UILanguage;
    if (saved === 'en' || saved === 'ja' || saved === 'vi') {
      return saved;
    }
    // 2. Fallback to Word Battle settings uiLanguage
    try {
      const wbSaved = localStorage.getItem('typing_adventure_wb_settings');
      if (wbSaved) {
        const parsed = JSON.parse(wbSaved);
        if (parsed.uiLanguage === 'en' || parsed.uiLanguage === 'ja' || parsed.uiLanguage === 'vi') {
          return parsed.uiLanguage;
        }
      }
    } catch {
      // ignore
    }
    // 3. Absolute fallback
    return 'vi';
  });

  const setLanguage = (lang: UILanguage) => {
    setLanguageState(lang);
    localStorage.setItem('typing_adventure_ui_language', lang);
    document.documentElement.lang = lang;
    document.body.setAttribute('data-lang', lang);
    
    // Sync Word Battle settings uiLanguage to match
    try {
      const wbSaved = localStorage.getItem('typing_adventure_wb_settings');
      let parsed = {} as any;
      if (wbSaved) {
        parsed = JSON.parse(wbSaved);
      }
      parsed.uiLanguage = lang;
      localStorage.setItem('typing_adventure_wb_settings', JSON.stringify(parsed));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.body.setAttribute('data-lang', language);
  }, [language]);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const getNestedValue = (obj: any, p: string) => {
      if (!obj) return undefined;
      return p.split('.').reduce((acc, key) => acc?.[key], obj);
    };

    // 1. Current language
    let text = getNestedValue(translations[language], path);
    // 2. Fallback check for flat keys under current language
    if (text === undefined || text === null) {
      text = (translations[language] as any)?.[path];
    }
    // 3. Fallback to English nested
    if (text === undefined || text === null) {
      text = getNestedValue(translations.en, path);
    }
    // 4. Fallback to English flat
    if (text === undefined || text === null) {
      text = (translations.en as any)?.[path];
    }
    // 5. Fallback to path itself
    if (text === undefined || text === null) {
      text = path;
    }

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useAppLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useAppLanguage must be used within a LanguageProvider');
  }
  return context;
}
