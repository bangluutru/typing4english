import React from 'react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage: string;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  uiLanguage
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#070314]/85 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="glass-panel w-full max-w-4xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden border border-cyber-accent/40 shadow-[0_0_30px_rgba(0,242,255,0.2)] bg-cyber-dark/95">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/40 flex justify-between items-center bg-cyber-dark/80">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-container text-[24px]">menu_book</span>
            <h2 className="font-headline-md text-headline-md text-primary font-bold uppercase tracking-wider drop-shadow-[0_0_8px_rgba(0,242,255,0.6)] neon-text-primary">
              {uiLanguage === 'vi' ? 'HƯỚNG DẪN SỬ DỤNG' : uiLanguage === 'ja' ? '使い方ガイド' : 'USER GUIDE'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary hover:bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar text-on-surface-variant bg-cyber-dark/40 font-body-md leading-relaxed text-xs space-y-5">
          {uiLanguage === 'vi' ? (
            // 🇻🇳 VIETNAMESE GUIDE
            <>
              <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl p-3 flex gap-3 items-center">
                <span className="material-symbols-outlined text-cyber-accent text-2xl animate-pulse">warning</span>
                <div className="text-[11px] text-gray-300">
                  <span className="text-cyber-accent font-bold uppercase font-mono-data">QUAN TRỌNG: </span> 
                  Hãy <strong>TẮT BỘ GÕ TIẾNG VIỆT (Telex / Unikey / EVKey)</strong> trên máy tính của bạn (chuyển sang gõ Tiếng Anh - chữ <strong>E</strong>) để tránh các lỗi dính phím hoặc gõ sai ký tự!
                </div>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sports_esports</span> 1. Quy tắc gõ phím & Khóa mục tiêu (Lock Target)
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li>Quan sát các từ vựng tiếng Anh (kèm nghĩa dịch) đang bay từ trên xuống.</li>
                  <li><strong>Khóa mục tiêu 🎯:</strong> Gõ ký tự <strong>ĐẦU TIÊN</strong> của một từ bất kỳ đang rơi trên màn hình. Phi thuyền của bạn sẽ lập tức khóa tâm ngắm đỏ vào từ đó.</li>
                  <li><strong>Nã đạn liên tiếp:</strong> Khi đã khóa mục tiêu, bạn <strong>phải gõ hoàn thành toàn bộ từ đó</strong> để tiêu diệt nó. Phi thuyền sẽ không nhận ký tự của từ khác cho tới khi mục tiêu hiện tại bị bắn hạ!</li>
                  <li><strong>Bảo vệ căn cứ:</strong> Hãy bắn hạ các từ trước khi chúng chạm vào <strong>vạch đỏ cảnh báo</strong> dưới cùng. Mỗi từ lọt lưới sẽ làm giảm Khiên Chắn (Shield) của bạn. Khiên về 0% = Game Over!</li>
                </ul>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">school</span> 2. Huấn luyện gõ 10 ngón chuyên nghiệp (Typing Coach)
                </h3>
                <p className="mb-2 text-gray-300">Hệ thống hỗ trợ gõ 10 ngón thông minh giúp bạn gõ phím không cần nhìn bàn phím:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li><strong>Đôi bàn tay ảo SVG 👋:</strong> Nhấp nháy chính xác ngón tay bạn cần dùng để gõ ký tự tiếp theo.</li>
                  <li><strong>Bàn phím ảo:</strong> Hướng dẫn vị trí đặt ngón tay home row tiêu chuẩn (tay trái: <code>A S D F</code>, tay phải: <code>J K L ;</code>, ngón cái: <code>Space</code>).</li>
                  <li><strong>Tập gõ Home Row nhanh:</strong> Nhấp vào nút <strong>"Tập gõ Home Row"</strong> tại cột giữa menu chính để rèn luyện cơ tay trước khi tham chiến.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">settings</span> 3. Cài đặt tối ưu cho Trẻ em & Người mới bắt đầu
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li><strong>Chế độ Học tập (Learning Mode):</strong> Giảm 30% tốc độ rơi của từ (mặc định còn <code>0.7x</code>), mục tiêu phát sáng rõ nét và giảm 50% sát thương lọt lưới.</li>
                  <li><strong>Tốc độ siêu chậm (0.3x Preset) 👶:</strong> Kéo thanh trượt tốc độ bay về mức <code>0.3x</code> hoặc <code>0.2x</code> để trẻ nhỏ tiểu học hoặc người mới bắt đầu tha hồ thời gian tìm phím.</li>
                  <li><strong>Phát âm từ vựng 🔊:</strong> Bật "Phát âm từ khi bị tiêu diệt" tại cột bên phải để kết hợp học gõ và luyện nghe giọng chuẩn Anh (UK) hoặc Mỹ (US).</li>
                  <li><strong>Nhân vật chiến cơ dễ thương 🐢:</strong> Ngoài Chiến cơ Cyber, Xe tăng thép 👦, Bướm Neon 👧, bạn có thể chọn <strong>Rùa hồng đáng yêu 🐢</strong> với mai rùa trái tim và tia bắn ma thuật hồng nhạt tuyệt đẹp.</li>
                  <li><strong>Đổi giao diện (Theme):</strong> Đổi giữa <em>Cyberpunk (Bé trai 👦)</em> màu xanh neon cá tính và <em>Magical (Bé gái 👧)</em> màu hồng tím ngọt ngào.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span> 4. Luyện tập thông minh & Từ vựng riêng
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li><strong>Luyện từ gắn sao (SLS) ⭐️:</strong> Ấn ngôi sao <code>⭐</code> bên cạnh từ khó trong từ điển hoặc nhật ký chiến trường để đưa vào hàng đợi ôn tập. Hệ thống Spaced Repetition sẽ lặp lại từ này thông minh.</li>
                  <li><strong>Tự tạo danh sách từ riêng 📚:</strong> Dùng bảng <strong>"Quản lý & File Import"</strong> để tự nhập từ thủ công hoặc kéo thả file Excel / CSV bài học trên lớp để học bài cực vui!</li>
                </ul>
              </div>
            </>
          ) : uiLanguage === 'ja' ? (
            // 🇯🇵 JAPANESE GUIDE
            <>
              <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl p-3 flex gap-3 items-center">
                <span className="material-symbols-outlined text-cyber-accent text-2xl animate-pulse">warning</span>
                <div className="text-[11px] text-gray-300">
                  <span className="text-cyber-accent font-bold uppercase font-mono-data">重要: </span> 
                  ゲームを始める前に、必ずPCの日本語入力入力を<strong>半角英数（English）</strong>に変更してください！ローマ字入力モードのままだと、正常にキー入力が反映されません。
                </div>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sports_esports</span> 1. タイピングとターゲットロックの規則
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li>上空から降下してくる英単語（および訳語）をよく確認します。</li>
                  <li><strong>ターゲットロックオン 🎯:</strong> 画面内のいずれかの単語の<strong>最初の文字</strong>をタイピングすると、赤い照準マークでロックオンされます。</li>
                  <li><strong>連射撃破:</strong> ロックオン中は、その単語を<strong>最後までタイピングし終える</strong>必要があります。現在のターゲットを撃墜するまで、他の単語を入力することはできません。</li>
                  <li><strong>防衛ライン:</strong> 下部の<strong>赤点線（警告ライン）</strong>を越える前に単語を撃破してください。侵入を許すとシールドが減少します。シールドが0%になるとゲームオーバーです。</li>
                </ul>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">school</span> 2. タッチタイピング・コーチ（Typing Coach）
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li><strong>バーチャルSVG両手 👋:</strong> 次に入力するキーをどの指で打つべきかを点滅してリアルタイムで指導します。</li>
                  <li><strong>仮想キーボード:</strong> ホームポジション（左手: <code>A S D F</code>、右手: <code>J K L ;</code>、親指: <code>Space</code>）を分かりやすくガイド。</li>
                  <li><strong>ホーム行練習モード:</strong> メインメニュー中央にある<strong>「ホーム行の練習」</strong>ボタンで、出撃前の指のウォーミングアップが可能です。</li>
                </ul>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">settings</span> 3. 子供・初心者向けの最適化設定
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li><strong>練習モード（Learning Mode）:</strong> 単語の降下速度が30%低下（デフォルト <code>0.7x</code>）し、ターゲットが明るく光り、シールドへのダメージが半減します。</li>
                  <li><strong>超低速（0.3x 設定） 👶:</strong> 速度スライダーを一番左の <code>0.3x</code> または <code>0.2x</code> にセットすると、小学生や完全な初心者でもキーを探すのに十分な時間が生まれます。</li>
                  <li><strong>音声発音 🔊:</strong> 右メニューの「撃破時に単語を発音する」を有効にすると、アメリカ英語（US）またはイギリス英語（UK）の発音を耳で学びながら遊べます。</li>
                  <li><strong>愛らしいシューター 🐢:</strong> サイバー戦闘機、戦車、蝶のほか、ハートのマイとピンクの魔法レーザーを放つ<strong>可愛いウミガメ（Cute Pink Turtle）🐢</strong>が選択可能です。</li>
                  <li><strong>テーマ切り替え 🎨:</strong> テーマをCyberpunkとMagicalの2つから自由に切り替えられます。</li>
                </ul>
              </div>
            </>
          ) : (
            // 🇺🇸 ENGLISH GUIDE
            <>
              <div className="bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl p-3 flex gap-3 items-center">
                <span className="material-symbols-outlined text-cyber-accent text-2xl animate-pulse">warning</span>
                <div className="text-[11px] text-gray-300">
                  <span className="text-cyber-accent font-bold uppercase font-mono-data">IMPORTANT: </span> 
                  Ensure your system keyboard input method is set to **English** (turn off Telex/IME/Unikey) to avoid typing conflicts or double character insertions!
                </div>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sports_esports</span> 1. Core Mechanics & Target Locking
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li>Observe the incoming vocabulary fighter jets flying from top to bottom.</li>
                  <li><strong>Lock Target 🎯:</strong> Press the **FIRST letter** of any falling word. Your crosshair will lock onto that word.</li>
                  <li><strong>Laser Fire:</strong> Once locked, you **must type the entire word to destroy it**. Your keyboard will ignore keys for other words until the active target is defeated!</li>
                  <li><strong>Base Defense:</strong> Vaporize words before they reach the **red warning line** at the bottom. Leaked words damage your Shield. Shield at 0% = Game Over!</li>
                </ul>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">school</span> 2. Interactive Typing Coach
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li>**SVG Hand Overlays 👋**: Flashes exactly which finger to use for the next character, helping you learn touch typing without looking down.</li>
                  <li>**Virtual Keyboard**: Visual guide on standard home row placement (left hand: `A S D F`, right hand: `J K L ;`, thumbs on `Space`).</li>
                  <li>**Home Row Warm-up**: Click **"Practice Home Row"** on the main menu to build key muscle memory before deploying into battle.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-primary-container font-bold text-sm mb-2 uppercase border-b border-primary-container/20 pb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">settings</span> 3. Kids & Beginner-Friendly Presets
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-300">
                  <li>**Learning Mode**: Reduces word speeds by 30% (`0.7x`), adds target glow assistance, and cuts leaked word damage by 50%.</li>
                  <li>**Super Slow Speed (`0.3x` / `0.2x`) 👶**: Drag the speed slider to its lowest settings. Highly recommended for elementary children or keyboard beginners.</li>
                  <li>**TTS Pronunciation 🔊**: Enable "Pronounce on Destroy" on the right console to hear spoken words in US or UK accent as you play.</li>
                  <li>**Magical & Cute Skins 🐢**: Choose the adorable new **Cute Pink Turtle 🐢** with heart shells and magical pink lasers, alongside the cool Cyber Fighter, Steel Tank 👦, and Neon Butterfly 👧.</li>
                  <li>**Dual Theme Support 🎨**: Switch between the neon-styled *Cyberpunk Theme (Boys 👦)* and the cozy, warm *Magical Theme (Girls 👧)*.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-cyber-dark/90 flex-shrink-0 text-[10px] font-mono text-gray-500">
          <span>SUITE VERSION 1.1.0 (VERIFIED)</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-gradient-to-r from-primary-container to-cyber-accent text-background font-bold uppercase rounded hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            {uiLanguage === 'vi' ? 'Đóng hướng dẫn' : uiLanguage === 'ja' ? '閉じる' : 'Close Guide'}
          </button>
        </div>
      </div>
    </div>
  );
};
