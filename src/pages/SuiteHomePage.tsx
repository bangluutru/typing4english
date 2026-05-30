import React from 'react';
import { Keyboard, Gamepad2, Zap, Sparkles, BookOpen } from 'lucide-react';

interface SuiteHomePageProps {
  onSelectModule: (module: 'typing-practice' | 'word-battle') => void;
}

export const SuiteHomePage: React.FC<SuiteHomePageProps> = ({ onSelectModule }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-16 select-none flex flex-col gap-10 md:gap-16">
      
      {/* Brand Hero & Introduction */}
      <div className="text-center flex flex-col items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyber-accent/10 border border-cyber-accent/30 rounded-full text-xs font-semibold text-cyber-accent uppercase tracking-wider animate-pulse mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phiên bản All-in-One</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent via-secondary-fixed-dim to-cyber-magenta tracking-tight uppercase leading-none drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
          Typing4English
        </h1>
        <p className="max-w-xl text-sm sm:text-base text-gray-300 font-medium leading-relaxed mt-2">
          Bệ phóng chinh phục kỹ năng gõ phím 10 ngón điêu luyện và làm chủ vốn từ vựng tiếng Anh qua trải nghiệm game học tập đỉnh cao.
        </p>
      </div>

      {/* Modern Two-Module Selection Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
        
        {/* Module 1: TypeMaster 10 Fingers */}
        <div 
          onClick={() => onSelectModule('typing-practice')}
          className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-6 cursor-pointer group hover:scale-[1.03] hover:border-cyber-accent transition-all duration-300 relative overflow-hidden shadow-lg shadow-cyber-accent/5 hover:shadow-cyber-accent/20"
        >
          {/* Decorative subtle pulse glow in card */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyber-accent/10 rounded-full blur-2xl group-hover:bg-cyber-accent/20 transition-all"></div>
          
          <div className="flex flex-col gap-4">
            {/* Header Badge & Icon */}
            <div className="flex justify-between items-start">
              <div className="p-4 bg-cyber-accent/10 text-cyber-accent rounded-2xl border border-cyber-accent/20 group-hover:scale-110 transition-transform">
                <Keyboard className="w-8 h-8" />
              </div>
              <span className="px-2.5 py-1 bg-cyber-accent/15 border border-cyber-accent/30 text-cyber-accent rounded-full text-[10px] font-bold tracking-wider uppercase font-mono">
                Luyện ngón chuẩn
              </span>
            </div>
            
            {/* Description */}
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black font-display text-gray-100 group-hover:text-cyber-accent transition-colors">
                Luyện Gõ 10 Ngón
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
                Học gõ phím cơ bản theo lộ trình chuẩn. Hướng dẫn trực quan với mô phỏng vị trí ngón tay động, phân tích heatmap phím lỗi và báo cáo học tập chi tiết.
              </p>
            </div>
          </div>

          {/* Card Features List */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2 text-xs text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyber-accent" />
                <span>30+ bài học lộ trình từ phím Cơ bản đến nâng cao</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyber-accent" />
                <span>Bàn tay động hướng dẫn đặt ngón thông minh</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyber-accent" />
                <span>Báo cáo WPM, Accuracy, Heatmap lỗi gõ chi tiết</span>
              </div>
            </div>

            <button className="w-full py-3 bg-cyber-accent hover:bg-cyber-accent/90 text-background font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">
              Bắt đầu luyện tập
            </button>
          </div>
        </div>

        {/* Module 2: English Air Battle */}
        <div 
          onClick={() => onSelectModule('word-battle')}
          className="glass-panel glass-panel-magenta rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-6 cursor-pointer group hover:scale-[1.03] hover:border-cyber-magenta transition-all duration-300 relative overflow-hidden shadow-lg shadow-cyber-magenta/5 hover:shadow-cyber-magenta/20"
        >
          {/* Decorative subtle pulse glow in card */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyber-magenta/10 rounded-full blur-2xl group-hover:bg-cyber-magenta/20 transition-all"></div>

          <div className="flex flex-col gap-4">
            {/* Header Badge & Icon */}
            <div className="flex justify-between items-start">
              <div className="p-4 bg-cyber-magenta/10 text-cyber-magenta rounded-2xl border border-cyber-magenta/20 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <span className="px-2.5 py-1 bg-cyber-magenta/15 border border-cyber-magenta/30 text-cyber-magenta rounded-full text-[10px] font-bold tracking-wider uppercase font-mono">
                Đấu trường từ vựng
              </span>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black font-display text-gray-100 group-hover:text-cyber-magenta transition-colors">
                Game Bắn Chữ Học Từ
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
                Chinh phục từ vựng tiếng Anh qua đấu trường arcade vũ trụ. Nhập file từ vựng tùy chỉnh, nghe phát âm chuẩn bản xứ, và phản xạ siêu nhanh cùng Typing Coach.
              </p>
            </div>
          </div>

          {/* Card Features List */}
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2 text-xs text-gray-400 font-medium">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyber-magenta" />
                <span>12+ Cấp độ phong phú (TOEIC, IELTS, TOEFL, Eiken...)</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyber-magenta" />
                <span>Hệ thống i18n hỗ trợ 3 ngôn ngữ giao diện (EN/JA/VI)</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyber-magenta" />
                <span>Import từ Excel/CSV, lưu từ yêu thích, ôn SRS thông minh</span>
              </div>
            </div>

            <button className="w-full py-3 bg-cyber-magenta hover:bg-cyber-magenta/90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">
              Gia nhập đấu trường
            </button>
          </div>
        </div>

      </div>

      {/* Recommended Learning Path Section */}
      <div className="w-full max-w-4xl mx-auto glass-panel p-6 rounded-3xl border border-outline-variant/30 flex flex-col gap-4">
        <div className="flex items-center gap-2.5 text-primary-container">
          <BookOpen className="w-5 h-5" />
          <h3 className="font-display font-black text-sm sm:text-base uppercase tracking-wider">
            Lộ trình học tập khuyên dùng
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-1">
          <div className="flex flex-col gap-2 p-4 bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl relative">
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-cyber-accent text-background flex items-center justify-center font-bold text-xs shadow">1</div>
            <h4 className="font-bold text-xs text-gray-200 mt-1 uppercase">Bước 1: Luyện Phím Chuẩn</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Truy cập module <b>Luyện Gõ 10 Ngón</b> để làm quen với vị trí phím, đặt ngón tay chuẩn xác, tăng độ chính xác lên 95%+.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl relative">
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-secondary-container text-background flex items-center justify-center font-bold text-xs shadow">2</div>
            <h4 className="font-bold text-xs text-gray-200 mt-1 uppercase">Bước 2: Phản Xạ Từ Vựng</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Vào module <b>Bắn Chữ Học Từ</b> ở chế độ <b>Học Tập (Learning Mode)</b> để nhớ mặt chữ và nghĩa của từ vựng tiếng Anh.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-surface-container-lowest/50 border border-outline-variant/20 rounded-2xl relative">
            <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-cyber-magenta text-white flex items-center justify-center font-bold text-xs shadow">3</div>
            <h4 className="font-bold text-xs text-gray-200 mt-1 uppercase">Bước 3: Thực Chiến Tăng Tốc</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Bật chế độ <b>Sinh Tồn (Battle Mode)</b>, tăng tốc độ rơi của chữ và chinh phục điểm số kỷ lục để nâng cao tốc độ phản xạ WPM.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
