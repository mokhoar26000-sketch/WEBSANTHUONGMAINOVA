# NOVA Market

MVP sàn thương mại điện tử kết hợp mua sắm, du lịch và trải nghiệm. Giao diện hiện tại dùng dữ liệu demo để kiểm tra luồng tìm kiếm, lọc theo nhu cầu, yêu thích và giỏ hàng.

## Chạy local

```bash
npm install
npm run dev
```

## Kết nối Firebase

1. Tạo một project trên Firebase Console.
2. Vào **Authentication → Sign-in method**, bật **Email/Password**. Sau đó bật Cloud Firestore.
3. Sao chép `.env.example` thành `.env` rồi điền Firebase Web App config.
4. Module `src/firebase.js` đã sẵn sàng export `auth` và `db`.

Các collection đề xuất:

- `products`: tên, giá, giá cũ, hình ảnh, danh mục, rating, số lượng đã bán, người bán.
- `users/{uid}`: hồ sơ, địa chỉ, danh sách yêu thích.
- `orders`: userId, items, total, status, createdAt.
- `experiences`: điểm đến, lịch, giá, sức chứa, nhà cung cấp.

## Đăng nhập và đăng ký

- Khách bấm **Đăng nhập** trên header để mở form đăng nhập/đăng ký.
- Đăng ký dùng Firebase Authentication và tạo document `users/{uid}`.
- Document user gồm `userId`, `name`, `email`, `phone`, `role`, `createdAt`.
- Role mặc định là `customer`. Không lưu mật khẩu trong Firestore; Firebase Authentication quản lý mật khẩu.
- Các role hợp lệ: `customer`, `shop`, `admin`. Chỉ admin được đổi role qua Firestore hoặc trang quản trị sau này.

Triển khai rules bảo mật:

```bash
firebase deploy --only firestore:rules
```

## Scripts

- `npm run dev`: chạy môi trường phát triển.
- `npm run build`: build production.
- `npm run preview`: xem bản build production.
