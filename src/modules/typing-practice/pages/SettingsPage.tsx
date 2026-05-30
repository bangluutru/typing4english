import React, { useRef } from 'react';
import { Settings, Volume2, Eye, Download, Upload, Trash2, HelpCircle } from 'lucide-react';
import type { TypingPracticeSettings, TypingThemeType, FontSize } from '../stores/settingsStore';
import type { UserProgress } from '../stores/progressStore';

interface SettingsPageProps {
  settings: TypingPracticeSettings;
  onUpdateSettings: (updater: Partial<TypingPracticeSettings>) => void;
  progress: UserProgress;
  onImportProgress: (jsonData: string) => boolean;
  onResetProgress: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  progress,
  onImportProgress,
  onResetProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `typemaster_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert('Không thể xuất dữ liệu sao lưu.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const resultStr = event.target?.result as string;
      if (resultStr) {
        const success = onImportProgress(resultStr);
        if (success) {
          alert('Khôi phục tiến trình học tập THÀNH CÔNG!');
        } else {
          alert('Tệp tin sao lưu không hợp lệ. Vui lòng kiểm tra lại.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4 w-full max-w-2xl px-4 select-none">
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
          <Settings className="w-7 h-7 text-tp-primary-500" />
          Cài đặt & Tùy chỉnh
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Cá nhân hóa môi trường học tập, giao diện và sao lưu dữ liệu của bạn.
        </p>
      </div>

      <div className="w-full flex flex-col gap-5 mt-2">
        <div className="tp-glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Giao diện ứng dụng (Theme)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', name: '☀️ Sáng', desc: 'Đơn giản & dịu mắt' },
              { id: 'dark', name: '🌙 Tối', desc: 'Hiện đại & bảo vệ mắt' },
              { id: 'kid', name: '🎒 Học sinh', desc: 'Pastel vui tươi, chữ to' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => onUpdateSettings({ theme: t.id as TypingThemeType })}
                className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                  settings.theme === t.id
                    ? 'bg-tp-primary-500 text-white border-tp-primary-600 shadow-md font-bold scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-tp-primary-300 dark:hover:border-tp-primary-800'
                }`}
              >
                <span className="text-sm">{t.name}</span>
                <span className={`text-[9px] opacity-75 ${settings.theme === t.id ? 'text-white/80' : 'text-slate-400'}`}>
                  {t.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="tp-glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Cấu hình luyện gõ
          </h3>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/10 dark:border-slate-800/10">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Âm thanh gõ phím</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Phát tiếng Click khi nhấn phím</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ soundEnabled: e.target.checked })}
                className="w-9 h-5 rounded-full bg-slate-300 checked:bg-tp-primary-500 appearance-none cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:left-4.5"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/10 dark:border-slate-800/10">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Bàn tay động (Hand Guide)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Hiện hình ngón tay hướng dẫn</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.handsEnabled}
                onChange={(e) => onUpdateSettings({ handsEnabled: e.target.checked })}
                className="w-9 h-5 rounded-full bg-slate-300 checked:bg-tp-primary-500 appearance-none cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:left-4.5"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200/10 dark:border-slate-800/10">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-slate-500" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Cho phép dùng [Backspace]</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Xóa ký tự gõ sai để sửa lỗi</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.backspaceEnabled}
                onChange={(e) => onUpdateSettings({ backspaceEnabled: e.target.checked })}
                className="w-9 h-5 rounded-full bg-slate-300 checked:bg-tp-primary-500 appearance-none cursor-pointer relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-all checked:before:left-4.5"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Cỡ chữ văn bản</span>
            <div className="grid grid-cols-4 gap-2">
              {(['sm', 'md', 'lg', 'xl'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`py-2 rounded-xl border text-xs font-black capitalize transition-all ${
                    settings.fontSize === size
                      ? 'bg-tp-primary-500 text-white border-tp-primary-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-200'
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

        <div className="tp-glass p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Dữ liệu & Sao lưu tiến trình
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
            TypeMaster ghi nhớ tiến trình học của bạn cục bộ trên thiết bị hiện tại. Hãy xuất sao lưu để tránh mất dữ liệu khi xóa cache trình duyệt.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <button
              onClick={handleExport}
              className="flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Xuất dữ liệu (.JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex justify-center items-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Khôi phục tiến trình</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        <div className="tp-glass p-5 rounded-3xl border border-red-200/40 dark:border-red-950/20 bg-red-500/5 shadow-sm flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-500">
            Vùng nguy hiểm
          </h3>
          <p className="text-[10px] sm:text-xs text-red-700/80 dark:text-red-400/80 font-medium">
            Hành động này sẽ xóa vĩnh viễn toàn bộ bài học đã hoàn thành, các kỷ lục gõ phím, heatmap lỗi gõ phím và thiết lập cài đặt của bạn.
          </p>
          <button
            onClick={() => {
              if (confirm('Bạn có hoàn toàn chắc chắn muốn xóa sạch dữ liệu tiến trình học tập? Hành động này KHÔNG THỂ đảo ngược.')) {
                onResetProgress();
                alert('Đã reset toàn bộ dữ liệu.');
              }
            }}
            className="flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset vĩnh viễn dữ liệu của tôi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
