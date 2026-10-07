# Sandbox Server Giả Lập CSDL Dược Quốc Gia (Quyết Định 806 / 232-QĐ-TTYQG)

Server sandbox viết bằng **NestJS** dùng để giả lập hệ thống CSDL Dược Quốc Gia, phục vụ phát triển & test tích hợp liên thông phần mềm quản lý nhà thuốc khi chưa truy cập được sandbox chính thức.

---

## 📁 Cấu Trúc Dự Án

```
ServerCSDL/
├── 806_Quyet-dinh-232-QD-TTYQG_3758dea867.pdf   # Tài liệu đặc tả chuẩn kết nối v2
├── src/
│   ├── data/
│   │   ├── types.ts           # Kiểu dữ liệu chuẩn QĐ 806 (MasterDrug, MasterUnit, StockInTransaction...)
│   │   └── mockData.ts        # Dữ liệu mock độc lập (Thuốc, Đơn vị, Nhà cung cấp, Phiếu nhập)
│   ├── modules/
│   │   ├── auth/              # Module xác thực (/auth/login)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── master/            # Module danh mục (/thuoc, /unit, /nhom-thuoc, /nha-cung-cap)
│   │   │   ├── master.controller.ts
│   │   │   ├── master.service.ts
│   │   │   └── master.module.ts
│   │   └── phieu-nhap/        # Module phiếu nhập (/phieu-nhap & CRUD & liên thông)
│   │       ├── phieu-nhap.controller.ts
│   │       ├── phieu-nhap.service.ts
│   │       ├── phieu-nhap.dto.ts
│   │       └── phieu-nhap.module.ts
│   ├── app.controller.ts      # Endpoint root thông tin server
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts                # Khởi động server (Port 3001, CORS enabled)
└── package.json
```

---

## 🚀 Khởi Chạy Server

```bash
# Cài đặt thư viện nếu cần
npm install

# Chạy server ở chế độ dev (tự động reload khi sửa code)
npm run start:dev
```
Server chạy tại: **`http://localhost:3001`** (Đã kích hoạt CORS sẵn sàng cho Frontend).

---

## 📡 Danh Sách API Sandbox

Server hỗ trợ đồng thời cả **Endpoint thân thiện (tiếng Việt)** và **Endpoint chuẩn Quyết định 806 (v2)**:

### 1. Quản Lý Phiếu Nhập Hàng

| Hành động | Endpoint thân thiện | Chuẩn QĐ 806 (v2) | Phương thức |
| :--- | :--- | :--- | :--- |
| **Lấy danh sách phiếu nhập** | `/phieu-nhap` | `/transactions/stock-in` | `GET` |
| **Chi tiết phiếu nhập** | `/phieu-nhap/:id` | `/transactions/stock-in/:id` | `GET` |
| **Tạo phiếu nhập mới** | `/phieu-nhap` | `/transactions/stock-in` | `POST` |
| **Sửa phiếu nhập** | `/phieu-nhap/:id` | `/transactions/stock-in/:id` | `PUT` |
| **Xóa phiếu nhập** | `/phieu-nhap/:id` | `/transactions/stock-in/:id` | `DELETE` |
| **Liên thông lên CSDL Dược QG** | `/phieu-nhap/lien-thong` hoặc `/phieu-nhap/:id/lien-thong` | `/transactions/stock-in/:id/sync` | `POST` |
| **Xem trạng thái xử lý** | `/phieu-nhap/:id/status` | `/transactions/stock-in/:id/status` | `GET` |

### 2. Danh Mục Dùng Chung (Master Data)

| Danh mục | Endpoint thân thiện | Chuẩn QĐ 806 (v2) | Phương thức |
| :--- | :--- | :--- | :--- |
| **Danh sách thuốc** | `/thuoc` | `/master/drugs` hoặc `/v2/master/drugs` | `GET` |
| **Chi tiết thuốc theo mã/SĐK** | `/thuoc/:id` | `/master/drugs/:drug_id` | `GET` |
| **Đơn vị tính** | `/unit` | `/master/units` hoặc `/v2/master/units` | `GET` |
| **Nhóm thuốc** | `/nhom-thuoc` | `/master/drug-groups` | `GET` |
| **Nhà cung cấp** | `/nha-cung-cap` | `/master/suppliers` | `GET` |

### 3. Xác Thực (Authentication)

| Chức năng | Endpoint | Phương thức |
| :--- | :--- | :--- |
| **Đăng nhập lấy Bearer token** | `/auth/login` hoặc `/v2/auth/login` | `POST` |

---

## 📝 Mẫu Dữ Liệu Request / Response

### A. Tạo phiếu nhập (`POST /phieu-nhap`)

**Request Body:**
```json
{
  "reference_number": "HD-NCC-20261007",
  "reason": "supplier",
  "supplier_id": "NCC001",
  "note": "Nhập đợt thuốc mới",
  "items": [
    {
      "drug_id": "VD-28432-17",
      "unit_id": "U003",
      "quantity": 50,
      "batch_no": "LO-260901",
      "expiry_date": "2028-09-01",
      "price": 72000
    }
  ]
}
```

**Response (Code 200):**
```json
{
  "code": 200,
  "message": "Tạo phiếu nhập hàng thành công (Sandbox CSDL Dược)",
  "transaction_id": "PN-20261007-1888",
  "status": "accepted",
  "data": { ... }
}
```

### B. Liên thông phiếu nhập (`POST /phieu-nhap/lien-thong`)

**Request Body:**
```json
{
  "transaction_id": "PN-20261007-1888"
}
```

**Response (Code 200):**
```json
{
  "code": 200,
  "status": "completed",
  "message": "Liên thông phiếu nhập thành công lên Cổng CSDL Dược Quốc Gia",
  "transaction_id": "PN-20261007-1888",
  "national_sync_id": "CSDLD-SYNC-1791386443901-8198",
  "synced_at": "2026-10-07T15:20:43.901Z"
}
```

### C. Lấy danh sách thuốc (`GET /thuoc` hoặc `GET /master/drugs`)

**Response:**
```json
{
  "page": 1,
  "total": 6,
  "data": [
    {
      "id": "VN-22019-19",
      "name": "Panadol Extra Đỏ",
      "registration_number": "VN-22019-19",
      "active_pharmaceutical_ingredient": "Paracetamol 500mg, Caffeine 65mg",
      "strength": "Paracetamol 500mg; Caffeine 65mg",
      "prescription_status": 0,
      "packagings": [
        { "unit_id": "U001", "unit_name": "Viên" },
        { "unit_id": "U003", "unit_name": "Hộp" }
      ]
    }
  ]
}
```
