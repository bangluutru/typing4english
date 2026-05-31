import React from 'react';
import { Keyboard, Gamepad2, Zap, Sparkles, BookOpen } from 'lucide-react';

interface SuiteHomePageProps {
  onSelectModule: (module: 'typing-practice' | 'word-battle') => void;
  appTheme?: 'cyberpunk' | 'magical';
}

export const SuiteHomePage: React.FC<SuiteHomePageProps> = ({ onSelectModule, appTheme = 'cyberpunk' }) => {
  const isMagical = appTheme === 'magical';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-16 select-none flex flex-col gap-10 md:gap-16">
      
      {/* Brand Hero & Introduction */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider animate-pulse mb-2 border ${
          isMagical 
            ? 'bg-pink-100/80 border-pink-200 text-pink-500' 
            : 'bg-cyber-accent/10 border-cyber-accent/30 text-cyber-accent'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isMagical ? 'Phiêu lưu Phép màu' : 'Phiêu lưu Không gian'}</span>
        </div>
        <h1 className={`text-5xl sm:text-7xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r tracking-tight uppercase leading-none ${
          isMagical 
            ? 'from-pink-500 via-purple-400 to-indigo-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]' 
            : 'from-cyber-accent via-secondary-fixed-dim to-cyber-magenta drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]'
        }`}>
          Typing4English
        </h1>
        <p className={`max-w-xl text-sm sm:text-base font-medium leading-relaxed mt-2 ${
          isMagical ? 'text-slate-600' : 'text-gray-300'
        }`}>
          Bệ phóng chinh phục kỹ năng gõ phím 10 ngón điêu luyện và làm chủ vốn từ vựng tiếng Anh qua trải nghiệm game học tập đỉnh cao.
        </p>
      </div>

      {/* Modern Two-Module Selection Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
        
        {/* Module 1: TypeMaster 10 Fingers */}
        <div 
          onClick={() => onSelectModule('typing-practice')}
          className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-6 cursor-pointer group hover:scale-[1.03] transition-all duration-300 relative overflow-hidden shadow-lg border ${
            isMagical 
              ? 'bg-white/90 border-pink-100 shadow-pink-100/50 hover:shadow-pink-200/60 hover:border-pink-300' 
              : 'glass-panel border-outline-variant/30 shadow-cyber-accent/5 hover:shadow-cyber-accent/20 hover:border-cyber-accent'
          }`}
        >
          {/* Decorative subtle pulse glow in card */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl transition-all ${
            isMagical ? 'bg-pink-200/20 group-hover:bg-pink-200/30' : 'bg-cyber-accent/10 group-hover:bg-cyber-accent/20'
          }`}></div>
          
          <div className="flex flex-col gap-4">
            {/* Header Badge & Icon */}
            <div className="flex justify-between items-start">
              <div className={`p-4 rounded-2xl border group-hover:scale-110 transition-transform ${
                isMagical 
                  ? 'bg-pink-50 text-pink-500 border-pink-100' 
                  : 'bg-cyber-accent/10 text-cyber-accent border-cyber-accent/20'
              }`}>
                <Keyboard className="w-8 h-8" />
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono border ${
                isMagical 
                  ? 'bg-pink-50/80 border-pink-100 text-pink-500' 
                  : 'bg-cyber-accent/15 border-cyber-accent/30 text-cyber-accent'
              }`}>
                Luyện ngón chuẩn
              </span>
            </div>
            
            {/* Description */}
            <div className="flex flex-col gap-2">
              <h2 className={`text-2xl font-black font-display transition-colors ${
                isMagical 
                  ? 'text-slate-800 group-hover:text-pink-500' 
                  : 'text-gray-100 group-hover:text-cyber-accent'
              }`}>
                Luyện Gõ 10 Ngón
              </h2>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                isMagical ? 'text-slate-500' : 'text-gray-400'
              }`}>
                Học gõ phím cơ bản theo lộ trình chuẩn. Hướng dẫn trực quan với mô phỏng vị trí ngón tay động, phân tích heatmap phím lỗi và báo cáo học tập chi tiết.
              </p>
            </div>
          </div>

          {/* Card Features List */}
          <div className="flex flex-col gap-4 mt-2">
            <div className={`flex flex-col gap-2 text-xs font-medium ${isMagical ? 'text-slate-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${isMagical ? 'text-pink-500' : 'text-cyber-accent'}`} />
                <span>30+ bài học lộ trình từ phím Cơ bản đến nâng cao</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${isMagical ? 'text-pink-500' : 'text-cyber-accent'}`} />
                <span>Bàn tay động hướng dẫn đặt ngón thông minh</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${isMagical ? 'text-pink-500' : 'text-cyber-accent'}`} />
                <span>Báo cáo WPM, Accuracy, Heatmap lỗi gõ chi tiết</span>
              </div>
            </div>

            <button className={`w-full py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
              isMagical 
                ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:opacity-95 text-white' 
                : 'bg-cyber-accent hover:bg-cyber-accent/90 text-background'
            }`}>
              Bắt đầu luyện tập
            </button>
          </div>
        </div>

        {/* Module 2: English Air Battle */}
        <div 
          onClick={() => onSelectModule('word-battle')}
          className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-6 cursor-pointer group hover:scale-[1.03] transition-all duration-300 relative overflow-hidden shadow-lg border ${
            isMagical 
              ? 'bg-white/90 border-purple-100 shadow-purple-100/50 hover:shadow-purple-200/60 hover:border-purple-300' 
              : 'glass-panel glass-panel-magenta border-outline-variant/30 shadow-cyber-magenta/5 hover:shadow-cyber-magenta/20 hover:border-cyber-magenta'
          }`}
        >
          {/* Decorative subtle pulse glow in card */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl transition-all ${
            isMagical ? 'bg-purple-200/20 group-hover:bg-purple-200/30' : 'bg-cyber-magenta/10 group-hover:bg-cyber-magenta/20'
          }`}></div>

          <div className="flex flex-col gap-4">
            {/* Header Badge & Icon */}
            <div className="flex justify-between items-start">
              <div className={`p-4 rounded-2xl border group-hover:scale-110 transition-transform ${
                isMagical 
                  ? 'bg-purple-50 text-purple-500 border-purple-100' 
                  : 'bg-cyber-magenta/10 text-cyber-magenta border-cyber-magenta/20'
              }`}>
                <Gamepad2 className="w-8 h-8" />
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono border ${
                isMagical 
                  ? 'bg-purple-50/80 border-purple-100 text-purple-500' 
                  : 'bg-cyber-magenta/15 border-cyber-magenta/30 text-cyber-magenta'
              }`}>
                Đấu trường từ vựng
              </span>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <h2 className={`text-2xl font-black font-display transition-colors ${
                isMagical 
                  ? 'text-slate-800 group-hover:text-purple-500' 
                  : 'text-gray-100 group-hover:text-cyber-magenta'
              }`}>
                Game Bắn Chữ Học Từ
              </h2>
              <p className={`text-xs sm:text-sm font-medium leading-relaxed ${
                isMagical ? 'text-slate-500' : 'text-gray-400'
              }`}>
                Chinh phục từ vựng tiếng Anh qua đấu trường arcade vũ trụ. Nhập file từ vựng tùy chỉnh, nghe phát âm chuẩn bản xứ, và phản xạ siêu nhanh cùng Typing Coach.
              </p>
            </div>
          </div>

          {/* Card Features List */}
          <div className="flex flex-col gap-4 mt-2">
            <div className={`flex flex-col gap-2 text-xs font-medium ${isMagical ? 'text-slate-500' : 'text-gray-400'}`}>
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${isMagical ? 'text-purple-500' : 'text-cyber-magenta'}`} />
                <span>12+ Cấp độ phong phú (TOEIC, IELTS, TOEFL, Eiken...)</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${isMagical ? 'text-purple-500' : 'text-cyber-magenta'}`} />
                <span>Hệ thống i18n hỗ trợ 3 ngôn ngữ giao diện (EN/JA/VI)</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className={`w-3.5 h-3.5 ${isMagical ? 'text-purple-500' : 'text-cyber-magenta'}`} />
                <span>Import từ Excel/CSV, lưu từ yêu thích, ôn SRS thông minh</span>
              </div>
            </div>

            <button className={`w-full py-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
              isMagical 
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-95 text-white' 
                : 'bg-cyber-magenta hover:bg-cyber-magenta/90 text-white'
            }`}>
              Gia nhập đấu trường
            </button>
          </div>
        </div>

      </div>

      {/* Recommended Learning Path Section */}
      <div className={`w-full max-w-4xl mx-auto p-6 rounded-3xl border flex flex-col gap-4 ${
        isMagical 
          ? 'bg-white/90 border-pink-100 shadow-lg shadow-pink-100/30' 
          : 'glass-panel border-outline-variant/30'
      }`}>
        <div className={`flex items-center gap-2.5 ${isMagical ? 'text-pink-500' : 'text-primary-container'}`}>
          <BookOpen className="w-5 h-5" />
          <h3 className="font-display font-black text-sm sm:text-base uppercase tracking-wider">
            Lộ trình học tập khuyên dùng
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-1">
          <div className={`flex flex-col gap-2 p-4 border rounded-2xl relative ${
            isMagical ? 'bg-pink-50/40 border-pink-100/50' : 'bg-surface-container-lowest/50 border-outline-variant/20'
          }`}>
            <div className={`absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow ${
              isMagical ? 'bg-pink-500 text-white' : 'bg-cyber-accent text-background'
            }`}>1</div>
            <h4 className={`font-bold text-xs mt-1 uppercase ${isMagical ? 'text-slate-800' : 'text-gray-200'}`}>Bước 1: Luyện Phím Chuẩn</h4>
            <p className={`text-[11px] leading-relaxed font-medium ${isMagical ? 'text-slate-500' : 'text-gray-400'}`}>
              Truy cập module <b>Luyện Gõ 10 Ngón</b> để làm quen với vị trí phím, đặt ngón tay chuẩn xác, tăng độ chính xác lên 95%+.
            </p>
          </div>

          <div className={`flex flex-col gap-2 p-4 border rounded-2xl relative ${
            isMagical ? 'bg-purple-50/40 border-purple-100/50' : 'bg-surface-container-lowest/50 border-outline-variant/20'
          }`}>
            <div className={`absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow ${
              isMagical ? 'bg-purple-500 text-white' : 'bg-secondary-container text-background'
            }`}>2</div>
            <h4 className={`font-bold text-xs mt-1 uppercase ${isMagical ? 'text-slate-800' : 'text-gray-200'}`}>Bước 2: Phản Xạ Từ Vựng</h4>
            <p className={`text-[11px] leading-relaxed font-medium ${isMagical ? 'text-slate-500' : 'text-gray-400'}`}>
              Vào module <b>Bắn Chữ Học Từ</b> ở chế độ <b>Học Tập (Learning Mode)</b> để nhớ mặt chữ và nghĩa của từ vựng tiếng Anh.
            </p>
          </div>

          <div className={`flex flex-col gap-2 p-4 border rounded-2xl relative ${
            isMagical ? 'bg-indigo-50/40 border-indigo-100/50' : 'bg-surface-container-lowest/50 border-outline-variant/20'
          }`}>
            <div className={`absolute -top-3 -left-3 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow ${
              isMagical ? 'bg-indigo-500 text-white' : 'bg-cyber-magenta text-white'
            }`}>3</div>
            <h4 className={`font-bold text-xs mt-1 uppercase ${isMagical ? 'text-slate-800' : 'text-gray-200'}`}>Bước 3: Thực Chiến Tăng Tốc</h4>
            <p className={`text-[11px] leading-relaxed font-medium ${isMagical ? 'text-slate-500' : 'text-gray-400'}`}>
              Bật chế độ <b>Sinh Tồn (Battle Mode)</b>, tăng tốc độ rơi của chữ và chinh phục điểm số kỷ lục để nâng cao tốc độ phản xạ WPM.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
