import type { UiLang } from './store';

/*
 * Giới thiệu, Chính sách bảo mật, Điều khoản (anh Bằng chốt 2026-11-12):
 * mọi trang con chottoday.com ghi người vận hành "Chiba Bang", liên hệ
 * support@chottoday.com, không công khai địa chỉ / điện thoại.
 * Văn bản tả đúng những gì app làm hôm nay: đổi cách lưu dữ liệu hay thêm
 * dịch vụ ngoài thì sửa file này cùng lúc.
 */
export const OPERATOR = 'Chiba Bang';
export const CONTACT_EMAIL = 'support@chottoday.com';

export type LegalKind = 'about' | 'privacy' | 'terms';
type Doc = { title: string; intro: string; sections: { h: string; p: string[] }[] };
type Legal = { nav: Record<LegalKind | 'contact', string>; updated: string; docs: Record<LegalKind, Doc> };

export const LEGAL: Record<UiLang, Legal> = {
  vi: {
    nav: { about: 'Giới thiệu', privacy: 'Chính sách bảo mật', terms: 'Điều khoản sử dụng', contact: 'Liên hệ' },
    updated: 'Cập nhật lần cuối: 12/11/2026',
    docs: {
      about: {
        title: 'Giới thiệu Typing4English',
        intro: 'Typing4English là công cụ miễn phí để luyện gõ phím và học từ vựng tiếng Anh, một trong các công cụ học của Chotto (chottoday.com).',
        sections: [
          { h: 'Ứng dụng làm gì', p: ['Bài gõ phím ngắn, từ vựng theo cấp Eiken có phát âm, và trò chơi luyện từ. Không cần đăng ký tài khoản.'] },
          { h: 'Người vận hành và liên hệ', p: [`Người vận hành: ${OPERATOR}`, `Liên hệ: ${CONTACT_EMAIL}`] },
        ],
      },
      privacy: {
        title: 'Chính sách bảo mật',
        intro: 'Chính sách này nói rõ ứng dụng lưu gì và gửi gì đi.',
        sections: [
          { h: '1. Không có tài khoản', p: ['Ứng dụng không có đăng nhập và không hỏi tên, email hay thông tin cá nhân nào của bạn.'] },
          { h: '2. Dữ liệu lưu trên máy bạn', p: ['Tiến độ học và cài đặt được lưu trong trình duyệt của bạn (localStorage), không gửi về máy chủ của chúng tôi. Xoá dữ liệu trang web trong trình duyệt là xoá hết.'] },
          { h: '3. Dịch vụ bên ngoài', p: ['Âm thanh từ vựng tải từ 英級アップ (eikyu-up.chottoday.com, cùng người vận hành). Phông chữ tải từ Google Fonts, nên Google nhận địa chỉ IP và thông tin trình duyệt của bạn khi tải.', 'Trang chạy trên Cloudflare. Cloudflare Web Analytics đếm lượt xem; theo Cloudflare, công cụ này không dùng cookie và không dùng địa chỉ IP để nhận ra bạn.'] },
          { h: '4. Liên hệ', p: [`Người vận hành: ${OPERATOR}`, `Câu hỏi về dữ liệu xin gửi tới ${CONTACT_EMAIL}.`] },
        ],
      },
      terms: {
        title: 'Điều khoản sử dụng',
        intro: 'Dùng ứng dụng nghĩa là bạn đồng ý với các điều khoản dưới đây.',
        sections: [
          { h: '1. Dịch vụ', p: ['Ứng dụng miễn phí, dùng cho việc học cá nhân.'] },
          { h: '2. Nội dung', p: ['Danh sách từ, âm thanh và bài học chỉ được dùng để học. Không sao chép, đăng lại, phân phối hay thu thập tự động (bot, crawl, scrape).'] },
          { h: '3. Miễn trừ', p: ['Ứng dụng được cung cấp như hiện có và có thể thay đổi hoặc ngừng mà không báo trước. Tiến độ lưu trong trình duyệt có thể mất khi bạn xoá dữ liệu hoặc đổi máy.'] },
          { h: '4. Thay đổi điều khoản', p: ['Điều khoản có thể được cập nhật. Tiếp tục dùng nghĩa là bạn chấp nhận điều khoản mới.'] },
          { h: '5. Liên hệ', p: [`Người vận hành: ${OPERATOR}`, `Liên hệ: ${CONTACT_EMAIL}`] },
        ],
      },
    },
  },
  en: {
    nav: { about: 'About', privacy: 'Privacy Policy', terms: 'Terms of Use', contact: 'Contact' },
    updated: 'Last updated: 12 November 2026',
    docs: {
      about: {
        title: 'About Typing4English',
        intro: 'Typing4English is a free tool for typing practice and English vocabulary. It is one of the learning tools of Chotto (chottoday.com).',
        sections: [
          { h: 'What it does', p: ['Short typing lessons, Eiken-level vocabulary with audio, and a word game. No account needed.'] },
          { h: 'Operator and contact', p: [`Operator: ${OPERATOR}`, `Contact: ${CONTACT_EMAIL}`] },
        ],
      },
      privacy: {
        title: 'Privacy Policy',
        intro: 'This policy explains what the app stores and what it sends.',
        sections: [
          { h: '1. No account', p: ['The app has no sign-in and does not ask for your name, e-mail or any personal information.'] },
          { h: '2. Data on your device', p: ['Your progress and settings are kept in your browser (localStorage) and are not sent to our servers. Clearing this site\'s data in your browser removes them.'] },
          { h: '3. Outside services', p: ['Word audio is loaded from 英級アップ (eikyu-up.chottoday.com, same operator). Fonts are loaded from Google Fonts, so Google receives your IP address and browser details when they load.', 'The site runs on Cloudflare. Cloudflare Web Analytics counts page views; according to Cloudflare it uses no cookies and does not use your IP address to identify you.'] },
          { h: '4. Contact', p: [`Operator: ${OPERATOR}`, `Questions about data: ${CONTACT_EMAIL}`] },
        ],
      },
      terms: {
        title: 'Terms of Use',
        intro: 'By using the app you agree to these terms.',
        sections: [
          { h: '1. The service', p: ['The app is free and meant for personal study.'] },
          { h: '2. Content', p: ['Word lists, audio and lessons may be used only for study. Do not copy, repost, distribute or collect them automatically (bots, crawling, scraping).'] },
          { h: '3. Disclaimer', p: ['The app is provided as is and may change or stop without notice. Progress kept in your browser can be lost if you clear site data or change devices.'] },
          { h: '4. Changes', p: ['These terms may be updated. Continuing to use the app means you accept the new terms.'] },
          { h: '5. Contact', p: [`Operator: ${OPERATOR}`, `Contact: ${CONTACT_EMAIL}`] },
        ],
      },
    },
  },
  ja: {
    nav: { about: 'このアプリについて', privacy: 'プライバシーポリシー', terms: '利用規約', contact: 'お問い合わせ' },
    updated: '最終更新日：2026年11月12日',
    docs: {
      about: {
        title: 'Typing4Englishについて',
        intro: 'Typing4Englishは、タイピング練習と英単語学習のための無料ツールです。Chotto（chottoday.com）の学習ツールの一つです。',
        sections: [
          { h: 'できること', p: ['短いタイピング練習、音声付きの英検レベル別単語、単語ゲーム。アカウント登録は不要です。'] },
          { h: '運営者・お問い合わせ', p: [`運営者：${OPERATOR}`, `お問い合わせ：${CONTACT_EMAIL}`] },
        ],
      },
      privacy: {
        title: 'プライバシーポリシー',
        intro: '本アプリが保存する情報と送信する情報を説明します。',
        sections: [
          { h: '1. アカウントなし', p: ['本アプリにはログインがなく、氏名・メールアドレスなどの個人情報をお尋ねしません。'] },
          { h: '2. 端末に保存するデータ', p: ['学習の進捗と設定はブラウザ（localStorage）に保存され、当方のサーバーには送信されません。ブラウザでこのサイトのデータを削除すると消えます。'] },
          { h: '3. 外部サービス', p: ['単語の音声は 英級アップ（eikyu-up.chottoday.com、同じ運営者）から読み込みます。フォントは Google Fonts から読み込むため、その際に Google が IP アドレスとブラウザ情報を受け取ります。', '本サイトは Cloudflare 上で動作し、Cloudflare Web Analytics でページビューを数えています。Cloudflare によると、Cookie を使わず、IP アドレスで利用者を識別しません。'] },
          { h: '4. お問い合わせ', p: [`運営者：${OPERATOR}`, `データに関するお問い合わせ：${CONTACT_EMAIL}`] },
        ],
      },
      terms: {
        title: '利用規約',
        intro: '本アプリのご利用をもって、以下の規約に同意したものとみなします。',
        sections: [
          { h: '1. サービス', p: ['本アプリは無料で、個人の学習を目的としています。'] },
          { h: '2. コンテンツ', p: ['単語リスト・音声・レッスンは学習のためにのみ利用できます。複製・転載・配布、自動収集（ボット、クロール、スクレイピング）は禁止します。'] },
          { h: '3. 免責', p: ['本アプリは現状のまま提供され、予告なく変更・停止することがあります。ブラウザに保存された進捗は、データ削除や端末変更で失われることがあります。'] },
          { h: '4. 規約の変更', p: ['本規約は更新されることがあります。利用を続けた場合、新しい規約に同意したものとみなします。'] },
          { h: '5. お問い合わせ', p: [`運営者：${OPERATOR}`, `お問い合わせ：${CONTACT_EMAIL}`] },
        ],
      },
    },
  },
};
