import { Tx } from '../components/Tx';
import { useSettings, type UiLang } from './store';
import { plain } from './ruby';
import { ja } from '../i18n/ja';
import { vi } from '../i18n/vi';
import { en, type Dict } from '../i18n/en';

/* --------------------------------------------------------------------------
   Strings may carry furigana as "[漢字|かんじ]". <Tx> renders them as <ruby>;
   plain() strips the reading for attributes (aria-label, title, <title>).
   {name} placeholders are filled from `vars`.
   -------------------------------------------------------------------------- */

const DICTS: Record<UiLang, Dict> = { ja, vi, en };
export type TKey = keyof Dict;
type Vars = Record<string, string | number>;


const fill = (s: string, vars?: Vars) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;

export function useT() {
  const [{ uiLang }] = useSettings();
  const dict = DICTS[uiLang];
  /** Raw string (may contain ruby markup). */
  const s = (key: TKey, vars?: Vars) => fill(dict[key] ?? en[key] ?? key, vars);
  /** Rendered node with furigana. */
  const t = (key: TKey, vars?: Vars) => <Tx text={s(key, vars)} />;
  /** Plain text for attributes. */
  const p = (key: TKey, vars?: Vars) => plain(s(key, vars));
  return { t, s, p, lang: uiLang };
}
