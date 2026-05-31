import { useAppLanguage } from './LanguageProvider';

export function useTranslation(_lang?: any) {
  const { t } = useAppLanguage();
  return t;
}

