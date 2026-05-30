import { translations } from './translations';
import type { UILanguage } from '../types/game';

export type TranslationKey = keyof typeof translations.en;

export function useTranslation(lang: UILanguage) {
  return function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let text = translations[lang]?.[key] ?? translations.en[key] ?? String(key);
    
    // Replace parameterized variables if provided (e.g. {errors}, {count})
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
  };
}
