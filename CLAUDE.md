# MMH Product Data — quy tắc làm việc cho Claude

Kho dữ liệu sản phẩm MANI Medical Hanoi: ứng dụng 1 file `index.html` (GitHub Pages từ `main`), dữ liệu ở Google Sheet
`1IQmW…`, tài liệu trên Google Drive (folder theo `FOLDER_MAP`: danh mục × loại tài liệu). Người dùng là nhân sự MMH,
không rành kỹ thuật — **trả lời và viết nội dung bằng tiếng Việt**. Kiến trúc & quy ước giống MMH Report Hub
(`ManiMedicalHanoi/MMH-Report`, xem CLAUDE.md ở đó) và dùng skill `gh-webapp-upgrader`.

## Quyền đã được chủ repo cho phép
- Khi người dùng bảo sửa / gộp: commit → PR → **squash merge vào `main`**, không cần hỏi lại.

## Mỗi thay đổi người dùng nhìn thấy (cùng PR)
1. Tăng `PD_VER` trong khối `<script id="pd-v2">` (badge cạnh tên app) và tham số `updates/notes.js?v=`.
2. Thêm mục lên ĐẦU `window.PD_UPDATES` (`updates/notes.js`): `id` = `YYYY-MM-DD-vX.Y`, `version`, `date`, `title`, `summary`,
   `items:[{type:"new"|"imp"|"fix", title, text, img}]` — kiểu *bấm vào đâu → làm gì → kết quả*. App tự hiện 7 ngày.
3. Ảnh thật (dữ liệu giả lập) ở `updates/vX.Y/*.jpg`, JPEG ~82, rộng ≤ 1300px: `tools/test/cap.js`.
4. Kiểm thử: `python3 -m http.server 8767` ở thư mục repo, rồi `NODE_PATH=$(npm root -g) node tools/test/run.js`
   (backend giả lập `tools/test/mock.js`; `script.google.com` bị chặn trong môi trường Claude). Kiểm cú pháp mọi `<script>` bằng `node --check`.

## Ghi chú kỹ thuật
- Vá lớp bằng khối `<script>` / `<style>` mới trước `</body>` (`window.fn = …`). Khối v2.0: `pd2-css` + `pd-v2`.
- **Đăng nhập (v2.0, `AUTH`)**: email công ty + mã 6 số qua Training Hub (`rhAuthStart` / `rhAuthVerify` / `rhAuthMe`, sheet `RH_Users`),
  dùng chung phiên `localStorage.mmh_tk` với Report Hub / CRM. Mọi lệnh gọi `script.google.com` tự gắn `tk=`. Chưa đăng nhập ⇒ `#pd-gate`, không tải dữ liệu.
- **Quyền (`PD`)**: xem = mọi người đăng nhập; sửa / thêm / upload / chuyển = Admin hoặc `perms.pd.e===1` (Report Hub ▸ Phân quyền người dùng ▸
  "Product Data"); xoá tài liệu = Admin. Lớp `body.pd-ro` / `body.pd-nodel` ẩn nút; các hàm ghi cũng tự chặn. Backend chưa kiểm `tk` (chờ đưa backend vào kho).
- **Mở tức thì**: `localStorage.pd_cache_v1` vẽ ngay rồi đồng bộ `list` phía sau.
- **Hàng đợi ghi `PQ`** (`localStorage.pd_outbox_v1`): thao tác cập nhật giao diện trước, lệnh `update` / `create` / `remove` / `move` chạy lần lượt
  bằng `callWrite` (fetch không kèm cookie, **không** tự gửi lại bằng thẻ `<script>`), lỗi mạng thử lại 2–60 s; `create` mất phản hồi ⇒ đọc `list`
  kiểm tra đã có chưa rồi mới gửi lại. `update` chỉ gửi ô đã đổi; ô tài liệu lấy theo trạng thái hiện tại trên máy lúc chạy. Dữ liệu cũ từ máy chủ ⇒ `overlay()` áp lại lệnh đang chờ.
  Lỗi thật ⇒ chip đỏ `#pd-q` + Thử lại / Bỏ. Mock: `drop:{create:1}`, `failWrite:'update'`, `lag`, `revoked`.
- Đã bỏ GSAP / ScrollTrigger / Swiper (thẻ dùng IntersectionObserver; thư viện ảnh `initGallery` cuộn ngang gốc).
- **Backend** (Apps Script gắn với file Sheet): khoá `product-data` trong kho riêng tư `ManiMedicalHanoi/mmh-backend` — **chưa có Script ID**
  (người dùng gửi từ Sheet ▸ Tiện ích mở rộng ▸ Apps Script ▸ ⚙ Cài đặt dự án). Có Script ID ⇒ kéo code, rồi: kiểm `tk` + quyền ở máy chủ,
  ID cố định cho sản phẩm + sheet `Files`, ghi bằng POST có `rid`, quy tắc đặt tên file. Sửa backend qua PR ở kho đó (tự deploy, URL không đổi);
  gộp backend trước, rồi mới gộp app.
- Hiện vẫn ghi theo `_row` (số dòng Sheet) và ô "Tên | link" — sẽ đổi khi có backend.
