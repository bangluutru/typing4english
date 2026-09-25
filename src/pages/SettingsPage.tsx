import { useRef, useState, type ReactNode } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { exportData, importData, progressStore, useSettings, type Settings } from '../lib/store';
import { useT, type TKey } from '../lib/i18n';
import { say } from '../lib/audio';
import { PageTitle } from '../components/ui';

function Row({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-0">
      <div className="min-w-48 flex-1">
        <div className="font-black">{label}</div>
        {hint && <div className="text-sm text-muted">{hint}</div>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Choice<K extends keyof Settings>({ k, value, children }: { k: K; value: Settings[K]; children: ReactNode }) {
  const [s, set] = useSettings();
  const on = s[k] === value;
  return (
    <button
      aria-pressed={on}
      onClick={() => set({ [k]: value } as Partial<Settings>)}
      className={`min-h-11 rounded-xl border-2 px-4 font-extrabold transition ${on ? 'border-teal bg-teal-soft text-teal-ink' : 'border-line bg-card hover:bg-dim'}`}
    >
      {children}
    </button>
  );
}

function Toggle({ k }: { k: 'furigana' | 'showKeyboard' | 'showHands' | 'sound' | 'voice' }) {
  const { t } = useT();
  return (
    <>
      <Choice k={k} value={true}>{t('common.on')}</Choice>
      <Choice k={k} value={false}>{t('common.off')}</Choice>
    </>
  );
}

export function SettingsPage() {
  const { t, p } = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<TKey | null>(null);

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `typing4english-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (f: File) => {
    const ok = importData(await f.text());
    setMsg(ok ? 'settings.importOk' : 'settings.importBad');
  };

  const reset = () => {
    if (window.confirm(p('settings.resetConfirm'))) {
      progressStore.reset();
      setMsg('settings.resetDone');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle icon="⚙️" title={t('nav.settings')} />

      <section className="card mb-6 px-5">
        <Row label={t('settings.uiLang')}>
          <Choice k="uiLang" value="ja">日本語</Choice>
          <Choice k="uiLang" value="vi">Tiếng Việt</Choice>
          <Choice k="uiLang" value="en">English</Choice>
        </Row>
        <Row label={t('settings.meaningLang')} hint={t('settings.meaningLangHint')}>
          <Choice k="meaningLang" value="ja">日本語</Choice>
          <Choice k="meaningLang" value="vi">Tiếng Việt</Choice>
        </Row>
        <Row label={t('settings.furigana')} hint={t('settings.furiganaHint')}><Toggle k="furigana" /></Row>
        <Row label={t('settings.theme')}>
          <Choice k="theme" value="light">{t('settings.theme.light')}</Choice>
          <Choice k="theme" value="dark">{t('settings.theme.dark')}</Choice>
          <Choice k="theme" value="system">{t('settings.theme.system')}</Choice>
        </Row>
      </section>

      <section className="card mb-6 px-5">
        <Row label={t('settings.layout')} hint={t('settings.layoutHint')}>
          <Choice k="layout" value="jis">{t('settings.layout.jis')}</Choice>
          <Choice k="layout" value="us">{t('settings.layout.us')}</Choice>
        </Row>
        <Row label={t('settings.showKeyboard')}><Toggle k="showKeyboard" /></Row>
        <Row label={t('settings.showHands')}><Toggle k="showHands" /></Row>
      </section>

      <section className="card mb-6 px-5">
        <Row label={t('settings.voice')} hint={t('settings.voiceHint')}>
          <Toggle k="voice" />
          <button className="btn btn-sm" onClick={() => say('mother', 'grade5_00001_word.mp3')}>{t('settings.test')}</button>
        </Row>
        <Row label={t('settings.sound')}><Toggle k="sound" /></Row>
      </section>

      <section className="card mb-6 px-5">
        <Row label={t('settings.data')} hint={t('settings.dataHint')}>
          <button className="btn btn-sm" onClick={download}><Download size={16} />{t('settings.export')}</button>
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()}><Upload size={16} />{t('settings.import')}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} />
        </Row>
        <Row label={t('settings.reset')} hint={t('settings.resetHint')}>
          <button className="btn btn-sm text-coral-ink" onClick={reset}><Trash2 size={16} />{t('settings.resetBtn')}</button>
        </Row>
        {msg && <p role="status" className="pb-4 font-bold text-teal-ink">{t(msg)}</p>}
      </section>

      <p className="text-center text-sm text-muted">{t('settings.about')}</p>
    </div>
  );
}
