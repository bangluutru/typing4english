# ☁️ HƯỚNG DẪN DEPLOY TRÊN CLOUDFLARE PAGES

Tài liệu này hướng dẫn chi tiết cách triển khai (deploy) ứng dụng **Typing4English** lên Cloudflare Pages. 

Vì **Typing4English** là một ứng dụng Single Page Application (SPA) xây dựng trên nền tảng React + Vite + TypeScript, việc deploy lên Cloudflare Pages cực kỳ đơn giản, nhanh chóng và hoàn toàn MIỄN PHÍ.

---

## 🚀 Cách 1: Deploy Tự Động Qua Git Integration (Khuyến Nghị)

Đây là cách tốt nhất vì Cloudflare Pages sẽ tự động xây dựng và cập nhật trang web của bạn mỗi khi bạn thực hiện `git push` lên GitHub.

### Bước 1: Kết nối tài khoản GitHub với Cloudflare
1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn **Workers & Pages** từ thanh menu bên trái.
3. Nhấp vào nút **Create Application** (Tạo ứng dụng).
4. Chọn tab **Pages** và nhấp vào **Connect to Git** (Kết nối với Git).
5. Làm theo hướng dẫn trên màn hình để liên kết tài khoản GitHub của bạn và chọn repository `bangluutru/typing4english`.

### Bước 2: Cấu hình Build Settings trên Cloudflare
Sau khi chọn repository, hãy cấu hình các thông số build như sau:

*   **Project Name**: `typing4english` (hoặc tùy chọn của bạn)
*   **Production Branch**: `main`
*   **Framework Preset**: `Vite` (Chọn preset này, Cloudflare sẽ tự động điền các thông số bên dưới)
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`

#### ⚙️ Biến Môi Trường (Environment Variables) - Quan Trọng:
Đảm bảo môi trường build sử dụng phiên bản Node.js phù hợp (Node.js 18 trở lên). Trong phần **Environment Variables**, hãy thêm khóa sau:
*   **Variable Name**: `NODE_VERSION`
*   **Value**: `20` (hoặc `18`)

### Bước 3: Deploy & Trải Nghiệm
1. Nhấp vào nút **Save and Deploy** (Lưu và Triển khai).
2. Cloudflare sẽ tiến hành nhân bản repository, cài đặt các thư viện phụ thuộc (`npm install`) và tiến hành build dự án (`npm run build`).
3. Sau 1-2 phút, bạn sẽ nhận được một địa chỉ URL có đuôi `.pages.dev` (ví dụ: `https://typing4english.pages.dev`).

---

## 🛠️ Cách 2: Deploy Thủ Công Qua Wrangler CLI (Không Cần GitHub)

Nếu bạn muốn deploy trực tiếp từ máy tính cá nhân của mình mà không cần đẩy code lên GitHub, bạn có thể sử dụng công cụ Wrangler của Cloudflare.

### Bước 1: Build ứng dụng local
Đầu tiên, hãy chạy lệnh build trên máy tính của bạn để tạo ra thư mục production `dist/`:
```bash
npm run build
```

### Bước 2: Đăng nhập vào Cloudflare CLI
Chạy lệnh sau để đăng nhập vào tài khoản Cloudflare của bạn thông qua trình duyệt:
```bash
npx wrangler login
```

### Bước 3: Deploy thư mục `dist` lên Pages
Chạy lệnh sau để tải thư mục `dist/` trực tiếp lên Cloudflare Pages:
```bash
npx wrangler pages deploy dist --project-name=typing4english
```

*Nếu đây là lần đầu tiên chạy lệnh này cho project, Wrangler sẽ hỏi bạn có muốn tạo dự án mới hay không, hãy chọn **Yes** và làm theo hướng dẫn.*

---

## ⚠️ Lưu Ý Khi Hoạt Động Trên Cloudflare Pages

- **Không cần file `_redirects`.** App dùng hash routing (`#/typing/1-1`), nên tải lại trang ở bất kỳ màn hình nào cũng không bị lỗi 404.
- **Audio phát âm** được lấy trực tiếp từ eikyu-up (`https://eiken-compass.pages.dev`). Nếu eikyu-up đổi domain, thêm biến môi trường `VITE_EIKYU_BASE` trong phần build settings.
