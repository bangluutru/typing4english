# Typing4English

Ứng dụng luyện gõ 10 ngón và học từ vựng tiếng Anh cho học sinh tiểu học và THCS ở Nhật. Đây là một công cụ nhỏ trong hệ sinh thái [Chotto](https://chottoday.com). Từ vựng và audio lấy từ **英級アップ (eikyu-up)**.

Giao diện có 3 ngôn ngữ: tiếng Nhật (có furigana), tiếng Việt và tiếng Anh. Bảng màu theo bộ nhận diện Chotto.

## Lộ trình học

| Bước | Màn hình | Nội dung |
|---|---|---|
| 1 | **Gõ phím** `#/typing` | 28 bài chia 6 chặng: hàng cơ sở (F J → G H), hàng trên, hàng dưới, Shift/dấu câu, chữ số, và thử thách gõ câu ví dụ Eiken. Mỗi lần chơi, bài tập được sinh mới từ những phím đã học. Từ khi đủ chữ cái, bài tập dùng từ tiếng Anh thật. |
| 2 | **Từ vựng** `#/words` | Học theo cấp Eiken (5 → 1), theo chủ đề và theo bộ 8 từ. Học một bộ gồm hai bước: *xem, nghe rồi gõ*, sau đó *nhớ lại và gõ*. Ôn tập theo hộp Leitner. |
| 3 | **Trò chơi** `#/game` | "Bóng bay từ vựng": gõ đúng từ để làm nổ bóng. Có chế độ Dễ (hiện cả từ) và Trí nhớ (chỉ hiện nghĩa và chữ cái đầu). |
| – | **Thành tích** `#/progress` | Chuỗi ngày học, thời gian luyện, tốc độ, phím hay gõ sai (heatmap), số từ đã học và đã thuộc theo từng cấp. |

Một số điểm dành riêng cho học sinh ở Nhật:
- Khi bộ gõ đang ở chế độ かな hoặc Caps Lock đang bật, app hiện cảnh báo thay vì tính là gõ sai.
- Bàn phím ảo có layout **JIS** (mặc định) và **US**.
- Bấm sai phím thì con trỏ đứng yên, nên không cần dùng Backspace.
- Tốc độ tính bằng số phím mỗi phút (打/分), mục tiêu 35–75 phím/phút, phù hợp lứa tuổi.

## Chạy

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # tsc + vite build → dist/
npm run lint
```

## Từ vựng (英級アップ)

`public/data/vocab/{5,4,3,pre2,2,pre1,1}.json` được sinh từ dữ liệu public của eikyu-up:

```bash
npm run sync:vocab                                            # đọc checkout ../../eiken-guru
EIKYU_SRC=https://eikyu-up.chottoday.com npm run sync:vocab  # hoặc lấy thẳng từ site
```

Script gom khoảng 170 nhãn danh mục nội bộ của eikyu-up thành 28 chủ đề thân thiện với trẻ. Script cũng bỏ dấu (café → cafe) và loại những từ không gõ được trên bàn phím thường.

Audio được phát trực tiếp từ route public `…/api/media/audio/vocab/*.mp3` của eikyu-up. Nếu thiếu file hoặc mất mạng, app chuyển sang giọng đọc TTS của trình duyệt. Muốn đổi domain thì đặt biến `VITE_EIKYU_BASE` lúc build.

## Cấu trúc

```
src/
  App.tsx              khung app + hash router (#/typing/1-1, #/study/5/family/0 …)
  index.css            token màu Chotto (sáng/tối), nút, thẻ
  lib/
    curriculum.ts      lộ trình gõ phím, sinh bài tập, chấm sao
    keyboard.ts        layout JIS/US, phím → ngón tay
    typing.ts          đọc phím (IME/Caps), hook gõ một dòng
    vocab.ts           tải từ vựng, chủ đề, cấp độ
    store.ts           settings + tiến độ (localStorage `t4e:*`), Leitner
    learning.ts        số liệu dẫn xuất dùng chung giữa các trang
    audio.ts           audio eikyu-up + TTS dự phòng + hiệu ứng âm thanh
    i18n.tsx, ruby.ts  t()/s()/p(), cú pháp furigana "[漢字|かんじ]"
  i18n/{ja,vi,en}.ts   bản dịch (en là khuôn kiểu)
  components/          Keyboard, Hands, TypingLine, ui
  pages/               Home, Course, Lesson, Words, Study, Game, Progress, Settings
functions/index.ts     Pages Function: typing4english.pages.dev → typing4english.chottoday.com (301)
```

## Liên kết với Chotto

App chạy ở **https://typing4english.chottoday.com** và có thẻ trong khối "Ứng dụng của Chotto" trên trang chủ chottoday.com (`src/data/apps.js` của repo chottoday). Để người dùng thấy đây vẫn là Chotto khi chuyển sang:

- Trên màn hình rộng, phía trên header có dải màu Mực *Chotto › Công cụ học tập › Typing4English*. Dải này giống dải của 英級アップ.
- Cạnh logo có chữ "by Chotto", chân trang có link về chottoday.com.
- Bảng màu, font và kiểu thẻ lấy từ token của chottoday (`src/index.css`).
- Thêm `?lang=vi|ja|en` vào bất kỳ URL nào để chọn ngôn ngữ giao diện. Tham số này thắng lựa chọn đã lưu, sau đó được lưu lại và xoá khỏi thanh địa chỉ. chottoday.com dẫn sang bằng `?lang=vi`. Lý do: nhiều người Việt ở Nhật để điện thoại tiếng Nhật, nếu đoán theo trình duyệt họ sẽ gặp giao diện tiếng Nhật.

Deploy: xem [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md). App là bundle tĩnh dùng hash routing, nên không cần cấu hình rewrite.
