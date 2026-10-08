/* Thông báo cập nhật MMH Product Data — mục mới thêm lên ĐẦU mảng. Xem CLAUDE.md. */
window.PD_UPDATES = [
  {
    id: "2026-10-08-v2.0", version: "2.0", date: "2026-10-08",
    title: "Đăng nhập bằng email · mở nhanh · lưu không phải chờ",
    summary: "Kho dữ liệu sản phẩm nay dùng chung tài khoản với Report Hub / CRM, mở ra là thấy ngay, mọi thay đổi lưu ngầm phía sau.",
    items: [
      { type: "new", title: "Đăng nhập bằng email công ty",
        text: "Mở app → nhập email công ty → nhập mã 6 số gửi về hộp thư. Máy được ghi nhớ 30 ngày, dùng chung tài khoản với MMH Report Hub và MMH CRM.",
        img: "updates/v2.0/login.jpg" },
      { type: "new", title: "Phân quyền: xem · sửa / upload · xoá",
        text: "Mọi nhân sự đăng nhập đều <b>xem</b> được. Nút Thêm, Sửa, Thêm tài liệu, Chuyển chỉ hiện với người được cấp quyền; <b>Xoá</b> tài liệu chỉ Admin. Góc phải trên cùng hiện tên và quyền của bạn.",
        img: "updates/v2.0/roles.jpg" },
      { type: "imp", title: "Mở app tức thì",
        text: "Lần mở sau app hiện ngay dữ liệu đã lưu trên máy, rồi tự cập nhật bản mới từ Google Sheet. Bỏ các thư viện hiệu ứng nặng nên trang nhẹ và mượt hơn, nhất là trên điện thoại." },
      { type: "imp", title: "Lưu không phải chờ",
        text: "Sửa thông tin, thêm sản phẩm, xoá hay chuyển tài liệu → màn hình đổi ngay, chip nhỏ góc trái dưới báo <b>Đang lưu… → Đã lưu vào Sheet</b>. Mạng yếu thì app tự thử lại; lỗi thật có nút Thử lại / Bỏ.",
        img: "updates/v2.0/saving.jpg" }
    ]
  }
];
