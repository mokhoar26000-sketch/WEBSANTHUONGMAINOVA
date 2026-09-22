# Tài liệu hệ thống NOVA Market

Ngày cập nhật: 21/09/2026

## 1. Tổng quan

NOVA Market là sàn thương mại điện tử theo hướng marketplace Shopee-style, tập trung vào các mặt hàng bán lẻ như quần áo, đồ gia dụng, đồ điện tử, thực phẩm chức năng, đồ ăn, đồ chơi thú cưng và dụng cụ tiện ích.

- Frontend: React + Vite
- Database: Firebase Cloud Firestore
- Authentication: Firebase Authentication
- Hosting: Firebase Hosting
- Analytics: Firebase Analytics
- Project ID: `thuongmaidientu-a4168`
- Website: https://thuongmaidientu-a4168.web.app

## 2. Mô hình dữ liệu chính

Sàn này hoạt động theo mô hình marketplace đa shop, trong đó:

- `users`: lưu tài khoản người dùng
- `shops`: lưu thông tin cửa hàng của người bán
- `products`: lưu sản phẩm của từng shop

Mọi sản phẩm thuộc về 1 shop nhất định, và mỗi shop thuộc về 1 user nhất định.

## 3. Các collection đang sử dụng

### 2.1 Firebase Authentication

Firebase Authentication quản lý tài khoản đăng nhập. Đây không phải collection Firestore.

Firebase tự quản lý:

- Email
- Mật khẩu đã mã hóa
- Firebase UID
- Trạng thái tài khoản
- Token đăng nhập

Mật khẩu không được lưu trong Firestore và ứng dụng không lưu mật khẩu dạng chữ thường.

### 3.1 Collection `users`

Document được tạo khi người dùng đăng ký hoặc đăng ký làm shop:

```text
users/{firebaseUserUid}
```

Cấu trúc document:

```js
{
  userId: "firebase uid",
  name: "Nguyễn Văn A",
  email: "email@gmail.com",
  phone: "0901234567",
  role: "customer",
  createdAt: Timestamp
}
```

Các role được thiết kế:

```text
customer
shop
admin
```

- `customer`: người mua hàng
- `shop`: chủ cửa hàng / người bán
- `admin`: quản trị viên hệ thống

Đăng ký công khai mặc định tạo role `customer`.

### 3.2 Collection `shops`

Được tạo khi user muốn mở shop:

```text
shops/{shopId}
```

Cấu trúc document:

```js
{
  shopId: "shop_001",
  userId: "firebase uid",
  shopName: "Shop Quần Áo Nova",
  description: "Bán quần áo và phụ kiện thời trang",
  phone: "0902345678",
  address: "Hà Nội",
  status: "active",
  logoUrl: "https://...",
  createdAt: Timestamp
}
```

Quan hệ:

- `shops.userId` là khóa phụ trỏ tới `users.userId`
- 1 user có thể có 1 shop chính
- 1 shop có nhiều sản phẩm

### 3.3 Collection `products`

Lưu toàn bộ hàng hóa trên sàn theo từng shop:

```text
products/{productId}
```

Cấu trúc document:

```js
{
  productId: "prod_001",
  shopId: "shop_001",
  userId: "firebase uid",
  productName: "Áo thun nam cotton",
  category: "thời trang",
  price: 199000,
  originalPrice: 299000,
  stock: 120,
  unit: "chiếc",
  description: "Áo thun thoáng mát, chất liệu cotton",
  imageUrls: ["https://..."],
  status: "active",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Các danh mục sản phẩm được hỗ trợ:

```text
thời trang
đồ gia dụng
đồ điện tử
thực phẩm chức năng
đồ ăn
đồ chơi thú cưng
dụng cụ
```

Quan hệ:

- `products.shopId` là khóa phụ trỏ tới `shops.shopId`
- `products.userId` là khóa phụ trỏ tới `users.userId` (nếu cần theo dõi người tạo)

Nếu collection `products` rỗng hoặc chưa có dữ liệu, app có thể dùng dữ liệu mẫu trong code.

## 4. Quan hệ khóa phụ và mô hình dữ liệu

### Quan hệ chính

```text
users.userId  ->  shops.userId
shops.shopId  ->  products.shopId
```

Nghĩa là:

- 1 user có thể mở 1 shop
- 1 shop có nhiều sản phẩm
- mỗi sản phẩm phải thuộc về 1 shop cụ thể

### Ví dụ thực tế

```text
users/{uid_001}
  role: "shop"

shops/{shop_001}
  userId: "uid_001"
  shopName: "Shop Gia Dụng HomeCare"

products/{prod_001}
  shopId: "shop_001"
  category: "đồ gia dụng"
  productName: "Bếp điện mini"
```

## 5. Collection đã thiết kế nhưng chưa sử dụng

### `orders`

Dự kiến lưu đơn hàng:

```js
{
  userId: "firebase uid",
  items: [],
  total: 0,
  status: "pending",
  createdAt: Timestamp
}
```

### `experiences`

Dự kiến lưu sản phẩm du lịch và trải nghiệm:

```js
{
  title: "Combo nghỉ dưỡng Phú Quốc",
  destination: "Phú Quốc",
  price: 3290000,
  schedule: [],
  capacity: 20,
  providerId: "shop uid"
}
```

Hai collection trên hiện chưa có chức năng ghi dữ liệu trong giao diện.

## 6. Các luồng đang hoạt động

### 6.1 Đăng ký

```text
Khách bấm Đăng nhập
→ Chọn Đăng ký ngay
→ Nhập họ tên, số điện thoại, email, mật khẩu
→ Firebase Authentication tạo tài khoản
→ Tạo users/{uid} trong Firestore
→ Gán role mặc định là customer
```

Mật khẩu được Firebase Authentication quản lý, không ghi vào document `users`.

### 6.2 Đăng nhập

```text
Khách nhập email và mật khẩu
→ Firebase Authentication xác thực
→ Ứng dụng lấy Firebase UID
→ Đọc users/{uid}
→ Hiển thị tên và thông tin tài khoản
```

### 6.3 Xem thông tin cá nhân

```text
Người dùng bấm avatar
→ Mở modal thông tin cá nhân
→ Hiển thị mã user, họ tên, email, số điện thoại và role
```

### 6.4 Đăng xuất

```text
Bấm avatar
→ Mở thông tin cá nhân
→ Bấm nút Đăng xuất
→ Firebase signOut
```

### 6.5 Quên mật khẩu

```text
Chọn Quên mật khẩu?
→ Nhập email đã đăng ký
→ Firebase gửi email khôi phục
→ Người dùng bấm link trong email
→ Đặt mật khẩu mới
```

Firebase mặc định gửi link đặt lại mật khẩu, không gửi mã 6 số. Muốn dùng mã 6 số cần Cloud Functions và dịch vụ gửi email riêng.

### 6.6 Hiển thị sản phẩm

```text
App gọi collection products
→ Đọc danh sách sản phẩm
→ Hiển thị sản phẩm lên giao diện
```

### 6.7 Tìm kiếm sản phẩm

```text
Khách nhập từ khóa
→ Lọc danh sách sản phẩm hiện có
→ Hiển thị kết quả phù hợp
```

### 6.8 Giỏ hàng

Giỏ hàng hiện đang lưu tạm trong React state:

```js
useState([])
```

Hiện tại:

- Chưa lưu vào Firestore.
- Refresh trang sẽ mất giỏ hàng.
- Chưa đồng bộ theo từng tài khoản.

### 6.9 Yêu thích

Danh sách yêu thích hiện cũng lưu tạm trong React state và chưa lưu vào Firestore.

## 7. Phân quyền Firestore

File rules: `firestore.rules`

Quy tắc hiện tại:

- User chỉ được tạo hồ sơ của chính mình.
- User đăng ký chỉ được tạo role `customer`.
- User không được tự đổi role.
- User chỉ đọc được hồ sơ của chính mình.
- Admin có thể quản lý user.
- Sản phẩm được phép đọc công khai.
- Chỉ admin được ghi, sửa và xóa sản phẩm.

Các role dự kiến:

| Role | Quyền dự kiến |
|---|---|
| `customer` | Mua hàng, quản lý hồ sơ, giỏ hàng, yêu thích |
| `shop` | Quản lý sản phẩm và đơn hàng của shop |
| `admin` | Quản trị toàn hệ thống, user, shop và sản phẩm |

## 8. Các file Firebase quan trọng

- `src/firebase.js`: khởi tạo Firebase, Auth, Firestore và Analytics.
- `src/App.jsx`: giao diện, đăng nhập, đăng ký, quên mật khẩu, hồ sơ.
- `firebase.json`: cấu hình Hosting và Firestore rules.
- `.firebaserc`: liên kết project Firebase.
- `firestore.rules`: bảo mật dữ liệu Firestore.
- `.env`: cấu hình Firebase Web App local, không commit lên Git.

## 9. Cấu hình cần bật trên Firebase Console

### Authentication

Vào:

```text
Authentication → Sign-in method → Email/Password → Enable
```

### Firestore

Vào:

```text
Build → Firestore Database
```

Rules đã được triển khai bằng:

```bash
firebase deploy --only firestore:rules
```

### Authorized domains

Đảm bảo có:

```text
localhost
thuongmaidientu-a4168.web.app
```

## 8. Lệnh chạy và triển khai

Chạy local:

```bash
cd marketplace-app
npm install
npm run dev
```

Build production:

```bash
npm run build
```

Deploy website:

```bash
firebase deploy --only hosting
```

Deploy Firestore rules:

```bash
firebase deploy --only firestore:rules
```

Deploy cả Hosting và rules:

```bash
npm run build
firebase deploy
```

## 9. Các chức năng nên phát triển tiếp

1. Lưu giỏ hàng vào Firestore theo `userId`.
2. Lưu danh sách yêu thích vào Firestore.
3. Tạo luồng đặt hàng và collection `orders`.
4. Xây trang quản lý shop.
5. Xây trang quản trị admin.
6. Cho admin phân quyền `customer`, `shop`, `admin`.
7. Thêm thanh toán online.
8. Thêm quản lý tồn kho và vận chuyển.
