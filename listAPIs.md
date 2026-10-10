# TÀI LIỆU HƯỚNG DẪN TÍCH HỢP API SANDBOX CSDL DƯỢC QUỐC GIA
*(Dành cho phía Client / Frontend kết nối theo Quyết định 806 & 232-QĐ-TTYQG)*

---

## 1. THÔNG TIN CHUNG

- **Host Sandbox Local**: `http://localhost:3001`
- **Định dạng dữ liệu**: `JSON (UTF-8)`
- **Header chung**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>` *(tùy chọn trong môi trường sandbox)*
- **CORS**: Đã kích hoạt sẵn `Allow-All Origin`, Client (React/Vite/NextJS chạy tại `localhost:3000` hoặc port khác) có thể gọi trực tiếp không bị chặn.

> **Ghi chú về Endpoint**: Server hỗ trợ song song 2 chuẩn đường dẫn:
> 1. **Chuẩn thân thiện (Alias tiếng Việt)**: Dễ gọi cho frontend (`/thuoc`, `/unit`, `/phieu-nhap`...).
> 2. **Chuẩn chính thức Quyết định 806 (v2)**: Dành cho kiểm thử giao thức quốc gia (`/master/drugs`, `/transactions/stock-in`...).

---

## 2. NHÓM API XÁC THỰC (AUTHENTICATION)

### 2.1. Đăng nhập hệ thống Sandbox
Lấy JWT Token để xác thực các API nghiệp vụ.

- **Đường dẫn**:
  - `POST http://localhost:3001/auth/login`
  - *(Hoặc)* `POST http://localhost:3001/v2/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
```json
{
  "username": "nhathuoc_viet",
  "password": "password123"
}
```
*(Lưu ý: Theo QĐ 806, password có thể là chuỗi thường hoặc đã mã hóa Base64).*

- **Response Mẫu Thành Công (200 OK)**:
```json
{
  "access_token": "mock_csdlduoc_token_bmhhdGh1b2NfdmlldA==_1791386456395",
  "token_type": "Bearer",
  "expires_in": 86400,
  "facility": {
    "username": "nhathuoc_viet",
    "facility_name": "Nhà thuốc Sandbox Test",
    "license_code": "GCN-NT-01294",
    "environment": "sandbox"
  }
}
```

- **Response Mẫu Thất Bại (401 Unauthorized - Sai tên đăng nhập hoặc mật khẩu)**:
```json
{
  "statusCode": 401,
  "error": "INVALID_CREDENTIALS",
  "message": "Tên đăng nhập hoặc mật khẩu không chính xác",
  "error_description": "Tên đăng nhập hoặc mật khẩu không chính xác"
}
```

- **Response Mẫu Thất Bại (400 Bad Request - Thiếu thông tin đăng nhập)**:
```json
{
  "statusCode": 400,
  "error": "INVALID_REQUEST",
  "message": "Thiếu tên đăng nhập hoặc mật khẩu (theo mục 5.1 Quyết định 806)",
  "error_description": "Thiếu tên đăng nhập hoặc mật khẩu (theo mục 5.1 Quyết định 806)"
}
```
*(Ghi chú: Theo Mục 5.1 và Phụ lục 6.1 Quyết định 806, các phản hồi lỗi HTTP 400/401 tuân thủ cấu trúc chuẩn gồm `error` là mã định danh lỗi và `error_description` là thông báo chi tiết).*

---

## 3. NHÓM API DANH MỤC DÙNG CHUNG (MASTER DATA)

### 3.1. Lấy danh sách đơn vị tính
Lấy các đơn vị tính chuẩn (Viên, Vỉ, Hộp, Chai, Lọ, Gói...).

- **Đường dẫn**:
  - `GET http://localhost:3001/unit`
  - *(Hoặc)* `GET http://localhost:3001/master/units`
  - *(Hoặc)* `GET http://localhost:3001/v2/master/units`
- **Query Params**:
  - `page`: Số trang (mặc định: `1`)
  - `page_size`: Số bản ghi mỗi trang (mặc định: `20`, tối đa `50`)
- **Ví dụ gọi**: `GET http://localhost:3001/unit?page=1&page_size=20`
- **Response Mẫu (200 OK)**:
```json
{
  "page": 1,
  "total": 10,
  "data": [
    { "id": "U001", "name": "Viên" },
    { "id": "U002", "name": "Vỉ" },
    { "id": "U003", "name": "Hộp" },
    { "id": "U004", "name": "Chai" },
    { "id": "U005", "name": "Lọ" },
    { "id": "U006", "name": "Gói" },
    { "id": "U007", "name": "Tuýp" },
    { "id": "U008", "name": "Ống" }
  ]
}
```

---

### 3.2. Lấy danh sách thuốc Quốc Gia (Có hỗ trợ lọc chính xác theo SĐK)
Lấy danh mục thuốc được cấp phép lưu hành theo chuẩn CSDL Dược Quốc Gia, hỗ trợ tìm kiếm đa năng và lọc chính xác theo Số đăng ký lưu hành.

- **Đường dẫn**:
  - `GET http://localhost:3001/thuoc`
  - *(Hoặc)* `GET http://localhost:3001/master/drugs`
  - *(Hoặc)* `GET http://localhost:3001/v2/master/drugs`
- **Query Params**:
  - `registration_number` hoặc `sdk`: Lọc chính xác theo Số đăng ký (VD: `VN-22019-19`, `VD-28432-17`). Rất hữu ích khi quét mã vạch hoặc nhập ô tìm kiếm SĐK.
  - `search` hoặc `q`: Từ khóa tìm kiếm đa năng (tên thuốc, hoạt chất, mã thuốc, SĐK).
  - `page`: Số trang (mặc định: `1`)
  - `page_size`: Số bản ghi/trang (mặc định: `20`)
- **Ví dụ gọi**: 
  - `GET http://localhost:3001/thuoc?registration_number=VN-22019-19`
  - `GET http://localhost:3001/thuoc?search=panadol`
- **Response Mẫu (200 OK)**:
```json
{
  "page": 1,
  "total": 1,
  "data": [
    {
      "id": "VN-22019-19",
      "name": "Panadol Extra Đỏ",
      "drug_group_id": "DG01",
      "drug_group_name": "Thuốc hạ sốt, giảm đau, chống viêm",
      "registration_number": "VN-22019-19",
      "active_pharmaceutical_ingredient": "Paracetamol 500mg, Caffeine 65mg",
      "strength": "Paracetamol 500mg; Caffeine 65mg",
      "routes": [
        { "id": "R01", "name": "Đường uống" }
      ],
      "prescription_status": 0,
      "special_control_type": 0,
      "packagings": [
        { "unit_id": "U001", "unit_name": "Viên", "gtin": "8935001200011" },
        { "unit_id": "U002", "unit_name": "Vỉ", "gtin": "8935001200028" },
        { "unit_id": "U003", "unit_name": "Hộp", "gtin": "8935001200035" }
      ],
      "manufacturer": {
        "id": "NSX01",
        "name": "GlaxoSmithKline Dungarvan Ltd.",
        "country": "IRL",
        "address": "Knockbrack, Dungarvan, Co. Waterford, Ireland"
      },
      "approval_date": "2019-05-15",
      "expiry_date": "2027-05-15"
    }
  ]
}
```

#### 📌 Chú thích các trường phân loại thuốc trong Response:
1. **`prescription_status` (Phân loại thuốc kê đơn theo mục 6.4.3 QĐ 806)**:
   - `0`: **Thuốc không kê đơn (OTC)** - Bán lẻ tự do không cần đơn thuốc của bác sĩ.
   - `1`: **Thuốc kê đơn (Rx / ETC)** - Bắt buộc phải có đơn thuốc của bác sĩ khi bán. Frontend nên hiển thị huy hiệu (Badge) cảnh báo.
2. **`special_control_type` (Phân loại thuốc kiểm soát đặc biệt theo mục 6.4.4 QĐ 806)**:
   - `0`: **Thuốc thông thường** (không thuộc diện KSĐB).
   - `1`: **Thuốc gây nghiện**, hoặc chứa dược chất gây nghiện.
   - `2`: **Thuốc hướng thần**, hoặc chứa dược chất hướng thần.
   - `3`: **Thuốc tiền chất**, hoặc chứa tiền chất làm thuốc.

---

### 3.3. Xem chi tiết thông tin thuốc
- **Đường dẫn**:
  - `GET http://localhost:3001/thuoc/:id`
  - *(Hoặc)* `GET http://localhost:3001/master/drugs/:id`
- **Params**:
  - `:id`: Mã định danh thuốc hoặc Số giấy phép lưu hành (VD: `VN-22019-19`, `VD-28432-17`).
- **Ví dụ gọi**: `GET http://localhost:3001/thuoc/VD-28432-17`

---

### 3.4. Danh mục nhóm thuốc & Nhà cung cấp
- **Danh mục nhóm thuốc**:
  - `GET http://localhost:3001/nhom-thuoc` hoặc `GET http://localhost:3001/master/drug-groups`
- **Danh mục nhà cung cấp**:
  - `GET http://localhost:3001/nha-cung-cap` hoặc `GET http://localhost:3001/master/suppliers`

---

## 4. NHÓM API QUẢN LÝ PHIẾU NHẬP HÀNG (STOCK-IN)

### 4.1. Lấy danh sách phiếu nhập
- **Đường dẫn**:
  - `GET http://localhost:3001/phieu-nhap`
  - *(Hoặc)* `GET http://localhost:3001/transactions/stock-in`
- **Query Params**:
  - `search` hoặc `q`: Tìm kiếm theo mã phiếu, số hóa đơn, tên nhà cung cấp.
- **Ví dụ gọi**: `GET http://localhost:3001/phieu-nhap`
- **Response Mẫu (200 OK)**:
```json
{
  "total": 2,
  "data": [
    {
      "transaction_id": "PN-20261001-001",
      "transaction_date": "2026-10-01T08:30:00",
      "import_date": "2026-10-01",
      "invoice_date": "2026-10-01",
      "reason": "supplier",
      "supplier_id": "NCC001",
      "supplier_name": "Công ty Cổ phần Dược Hậu Giang (DHG Pharma)",
      "reference_number": "HD-DHG-88291",
      "practice_license_code": "GCN-NT-01294",
      "note": "Nhập thuốc đợt đầu tháng 10/2026",
      "status": "completed",
      "is_synced": true,
      "synced_at": "2026-10-01T08:35:12",
      "national_sync_id": "CSDLD-SYNC-20261001-98721",
      "total_amount": 5600000,
      "items": [
        {
          "drug_id": "VD-28432-17",
          "drug_name": "Hapacol 650",
          "unit_id": "U003",
          "unit_name": "Hộp",
          "quantity": 50,
          "batch_no": "LO-260901",
          "batch_number": "LO-260901",
          "packaging_specifications": "Hộp 10 vỉ x 10 viên",
          "expiry_date": "2028-09-01",
          "gtin": "8934567890147",
          "price": 72000,
          "total_price": 3600000
        }
      ]
    }
  ]
}
```

---

### 4.2. Xem chi tiết phiếu nhập
- **Đường dẫn**:
  - `GET http://localhost:3001/phieu-nhap/:id`
  - *(Hoặc)* `GET http://localhost:3001/transactions/stock-in/:id`
- **Params**:
  - `:id`: Mã phiếu (`transaction_id`) hoặc Số chứng từ (`reference_number`).
- **Ví dụ gọi**: `GET http://localhost:3001/phieu-nhap/PN-20261001-001`

---

### 4.3. Tạo mới phiếu nhập (POST /phieu-nhap)
Tạo phiếu nhập hàng vào kho và lưu trên hệ thống sandbox (trạng thái ban đầu: `accepted`, `is_synced: false`).

- **Đường dẫn**:
  - `POST http://localhost:3001/phieu-nhap`
  - *(Hoặc)* `POST http://localhost:3001/transactions/stock-in`
- **Headers**: `Content-Type: application/json`

#### Trường hợp 1: Nhập thuốc chuẩn có trong CSDL Quốc Gia
**Request Body**:
```json
{
  "transaction_date": "2026-10-06T14:30:00",
  "invoice_date": "2026-10-06",
  "reference_number": "HD-NCC-88899",
  "reason": "supplier",
  "supplier_id": "NCC001",
  "supplier_name": "Công ty Cổ phần Dược Hậu Giang",
  "practice_license_code": "GCN-NT-01294",
  "note": "Nhập bổ sung Decolgen và Panadol",
  "items": [
    {
      "drug_id": "VD-27618-17",
      "unit_id": "U003",
      "quantity": 20,
      "batch_no": "DEC-260101",
      "packaging_specifications": "Hộp 10 vỉ x 10 viên",
      "expiry_date": "2027-06-18",
      "price": 45000
    },
    {
      "drug_id": "VN-22019-19",
      "unit_id": "U003",
      "quantity": 15,
      "batch_number": "PAN-260815",
      "packaging_specifications": "Hộp 15 vỉ x 12 viên",
      "expiry_date": "2028-08-15",
      "price": 100000
    }
  ]
}
```

#### Trường hợp 2: Nhập thuốc ngoài danh mục (Thuốc tự khai báo / Thuốc mới)
Khi nhà thuốc nhập mặt hàng mới chưa có mã CSDL Dược Quốc Gia, Frontend gửi `drug_id: null` (hoặc `"CUSTOM_DRUG"`) kèm tên thuốc và số đăng ký:
```json
{
  "transaction_date": "2026-10-06",
  "invoice_date": "2026-10-06",
  "reference_number": "HD-VAT-9921",
  "reason": "supplier",
  "supplier_name": "Dược phẩm Đông Y Gia Định",
  "note": "Nhập thuốc gia truyền tự khai báo",
  "items": [
    {
      "drug_id": null,
      "drug_name": "Thuốc bột thảo dược gia truyền",
      "registration_number": "VD-TUTẠO-01",
      "unit_id": "U006",
      "quantity": 100,
      "batch_no": "LO-BOT-2601",
      "expiry_date": "2028-10-06",
      "price": 15000
    }
  ]
}
```

#### 📌 Chi tiết các trường quan trọng:
- **`transaction_date` / `import_date`**: Ngày thực tế nhập hàng vào kho (định dạng `YYYY-MM-DD` hoặc `YYYY-MM-DDTHH:mm:ss`). Hỗ trợ nhập lùi ngày (back-date). Nếu không truyền, server tự động gán ngày giờ hiện tại.
- **`invoice_date`**: Ngày lập hóa đơn VAT (định dạng `YYYY-MM-DD`) phục vụ đối soát kế toán & thuế.
- **`reference_number`**: Số hóa đơn / Số chứng từ nhập hàng.
- **Quy ước Số lô (`batch_no` vs `batch_number`)**: Mock Server **tự động map alias linh hoạt** giữa `batch_no` và `batch_number`. Client có thể gửi một trong hai trường đều hợp lệ.
- **Response Mẫu (200 OK)**:
```json
{
  "code": 200,
  "message": "Tạo phiếu nhập hàng thành công (Sandbox CSDL Dược)",
  "transaction_id": "PN-20261006-6633",
  "status": "accepted",
  "data": {
    "transaction_id": "PN-20261006-6633",
    "transaction_date": "2026-10-06T14:30:00",
    "import_date": "2026-10-06",
    "invoice_date": "2026-10-06",
    "reason": "supplier",
    "supplier_name": "Dược phẩm Đông Y Gia Định",
    "reference_number": "HD-VAT-9921",
    "practice_license_code": "GCN-NT-01294",
    "status": "accepted",
    "is_synced": false,
    "total_amount": 1500000,
    "items": [
      {
        "drug_id": "CUSTOM-6399",
        "drug_name": "Thuốc bột thảo dược gia truyền",
        "registration_number": "VD-TUTẠO-01",
        "unit_id": "U006",
        "unit_name": "Gói",
        "quantity": 100,
        "batch_no": "LO-BOT-2601",
        "batch_number": "LO-BOT-2601",
        "expiry_date": "2028-10-06",
        "price": 15000,
        "total_price": 1500000,
        "is_custom_drug": true
      }
    ],
    "created_at": "2026-10-07T15:37:36.697Z",
    "updated_at": "2026-10-07T15:37:36.697Z"
  }
}
```

---

### 4.4. Cập nhật phiếu nhập (PUT)
Sửa thông tin phiếu nhập **khi chưa liên thông** (`is_synced: false`).

- **Đường dẫn**:
  - `PUT http://localhost:3001/phieu-nhap/:id`
  - *(Hoặc)* `PUT http://localhost:3001/transactions/stock-in/:id`
- **Params**:
  - `:id`: Mã phiếu nhập (VD: `PN-20261006-6633`).
- **Headers**: `Content-Type: application/json`
- **Request Body**: *(Truyền các trường muốn cập nhật)*
```json
{
  "note": "Đã kiểm hàng đủ, cập nhật lại ghi chú",
  "invoice_date": "2026-10-07",
  "reference_number": "HD-NCC-88899-EDIT"
}
```

#### ⚠️ Quy định chặn sửa khi đã liên thông:
Nếu phiếu đã liên thông lên CSDL Dược Quốc Gia (`is_synced: true` hoặc `status: "completed"`), Server sẽ **từ chối và trả về lỗi 400 Bad Request**:
```json
{
  "statusCode": 400,
  "error": "SYNCED_TRANSACTION_IMMUTABLE",
  "error_description": "Phiếu nhập PN-20261001-001 đã liên thông lên CSDL Dược Quốc Gia (status: completed), không thể chỉnh sửa trực tiếp. Vui lòng lập phiếu điều chỉnh nếu cần thay đổi dữ liệu."
}
```
*Frontend dev bắt mã lỗi `SYNCED_TRANSACTION_IMMUTABLE` để hiển thị popup thông báo khóa nút Sửa.*

---

### 4.5. Xóa phiếu nhập (DELETE)
Chỉ cho phép xóa phiếu **khi chưa liên thông** (`is_synced: false`).

- **Đường dẫn**:
  - `DELETE http://localhost:3001/phieu-nhap/:id`
  - *(Hoặc)* `DELETE http://localhost:3001/transactions/stock-in/:id`
- **Params**:
  - `:id`: Mã phiếu cần xóa.
- **Response Thành Công (200 OK)**:
```json
{
  "code": 200,
  "message": "Đã xóa thành công phiếu nhập PN-20261006-6633",
  "transaction_id": "PN-20261006-6633"
}
```

#### ⚠️ Quy định chặn xóa khi đã liên thông:
Nếu phiếu đã liên thông (`is_synced: true`), Server sẽ **từ chối và trả về lỗi 400 Bad Request**:
```json
{
  "statusCode": 400,
  "error": "SYNCED_TRANSACTION_IMMUTABLE",
  "error_description": "Phiếu nhập PN-20261001-001 đã liên thông lên CSDL Dược Quốc Gia (status: completed), không thể xóa trực tiếp."
}
```

---

### 4.6. Liên thông phiếu nhập lên CSDL Dược Quốc Gia
Mô phỏng hành động đẩy phiếu nhập lên Cổng Dược Quốc Gia. Trạng thái phiếu sẽ chuyển sang `completed`, `is_synced: true` và nhận được mã biên nhận `national_sync_id`.

- **Cách 1: Truyền mã phiếu trong URL**
  - **Đường dẫn**: `POST http://localhost:3001/phieu-nhap/:id/lien-thong`
  - **Ví dụ**: `POST http://localhost:3001/phieu-nhap/PN-20261006-6633/lien-thong`
- **Cách 2: Truyền mã phiếu trong Body**
  - **Đường dẫn**: `POST http://localhost:3001/phieu-nhap/lien-thong`
  - **Request Body**:
  ```json
  {
    "transaction_id": "PN-20261006-6633"
  }
  ```

- **Response Mẫu (200 OK)**:
```json
{
  "code": 200,
  "status": "completed",
  "message": "Liên thông phiếu nhập thành công lên Cổng CSDL Dược Quốc Gia",
  "transaction_id": "PN-20261006-6633",
  "national_sync_id": "CSDLD-SYNC-1791386443901-8198",
  "synced_at": "2026-10-07T15:20:43.901Z",
  "data": {
    "transaction_id": "PN-20261006-6633",
    "status": "completed",
    "is_synced": true,
    "national_sync_id": "CSDLD-SYNC-1791386443901-8198",
    "synced_at": "2026-10-07T15:20:43.901Z"
  }
}
```

---

### 4.7. Kiểm tra trạng thái xử lý phiếu nhập
Theo dõi tình trạng tiếp nhận dữ liệu của hệ thống Quốc Gia.

- **Đường dẫn**:
  - `GET http://localhost:3001/phieu-nhap/:id/status`
  - *(Hoặc)* `GET http://localhost:3001/transactions/stock-in/:id/status`
- **Params**:
  - `:id`: Mã phiếu nhập.
- **Response Mẫu (200 OK)**:
```json
{
  "transaction_id": "PN-20261006-6633",
  "status": "completed",
  "is_synced": true,
  "synced_at": "2026-10-07T15:20:43.901Z",
  "national_sync_id": "CSDLD-SYNC-1791386443901-8198",
  "message": "Phiếu nhập đã được xử lý và liên thông thành công"
}
```

---

---

## 5. NHÓM API QUẢN LÝ PHIẾU XUẤT HÀNG (STOCK-OUT TRANSACTIONS - QUYẾT ĐỊNH 806)

> **⚠️ Lưu ý xác thực (Authorization)**: Theo Mục 5.4 Quyết định 806, các API Giao dịch xuất kho **bắt buộc phải có Bearer Token** trong header:
> `Authorization: Bearer <access_token>`
> *(Token lấy từ API `POST /auth/login` hoặc truyền param `?token=<access_token>` khi kiểm tra nhanh trên trình duyệt).*

### 5.1. Lấy danh sách phiếu xuất kho
Hiển thị bảng quản lý các phiếu xuất đã tạo, hỗ trợ tìm kiếm đa năng và lọc theo trạng thái liên thông (`is_synced`), trạng thái xử lý (`status`).

- **Đường dẫn**:
  - `GET http://localhost:3001/phieu-xuat`
  - *(Hoặc)* `GET http://localhost:3001/transactions/stock-out`
  - *(Hoặc)* `GET http://localhost:3001/v2/transactions/stock-out`
- **Headers**:
  - `Authorization: Bearer <access_token>` *(Bắt buộc)*
- **Query Params**:
  - `search` hoặc `q`: Tìm kiếm theo mã phiếu (`transaction_id`), số hóa đơn/chứng từ (`reference_number`), ghi chú, tên đối tác hoặc tên thuốc.
  - `status`: Lọc theo trạng thái xử lý (`accepted`, `processing`, `completed`, `rejected`).
  - `is_synced`: Lọc theo trạng thái liên thông (`true` hoặc `false`).
  - `page`: Trang hiện tại (mặc định: `1`).
  - `page_size`: Số bản ghi mỗi trang (mặc định: `20`).
- **Ví dụ gọi**: `GET http://localhost:3001/transactions/stock-out?is_synced=false&page=1&page_size=20`
- **Response Mẫu (200 OK)**:
```json
{
  "page": 1,
  "page_size": 20,
  "total": 2,
  "data": [
    {
      "transaction_id": "PX-20261008-001",
      "transaction_date": "2026-10-08T10:30:00",
      "export_date": "2026-10-08",
      "reason": "sale-retail",
      "reference_number": "HD-BL-2026-0012",
      "practice_license_code": "GCN-NT-01294",
      "note": "Xuất bán lẻ cho khách vãng lai",
      "status": "completed",
      "is_synced": true,
      "synced_at": "2026-10-08T10:35:10.123Z",
      "national_sync_id": "CSDLD-SYNC-20261008-5521",
      "total_amount": 108000,
      "items": [
        {
          "drug_id": "VN-22019-19",
          "drug_name": "Panadol Extra Đỏ",
          "registration_number": "VN-22019-19",
          "unit_id": "U002",
          "unit_name": "Vỉ",
          "quantity": 2,
          "batch_no": "PAN-260815",
          "batch_number": "PAN-260815",
          "packaging_specifications": "Hộp 15 vỉ x 12 viên",
          "expiry_date": "2028-08-15",
          "gtin": "8935001200028",
          "price": 36000,
          "total_price": 72000,
          "manufacturer": {
            "id": "NSX01",
            "name": "GlaxoSmithKline Dungarvan Ltd.",
            "country": "IRL"
          }
        }
      ],
      "created_at": "2026-10-08T10:30:00.000Z",
      "updated_at": "2026-10-08T10:35:10.123Z"
    }
  ]
}
```

---

### 5.2. Xem chi tiết phiếu xuất (Mục 5.4.5 Quyết định 806)
Xem chi tiết một phiếu xuất kho gồm danh sách từng mặt hàng thuốc, số lô, hạn dùng, đơn giá và tổng tiền.

- **Đường dẫn**:
  - `GET http://localhost:3001/phieu-xuat/:id`
  - *(Hoặc)* `GET http://localhost:3001/transactions/stock-out/:id`
  - *(Hoặc)* `GET http://localhost:3001/v2/transactions/stock-out/:id`
- **Headers**:
  - `Authorization: Bearer <access_token>` *(Bắt buộc)*
- **Params**:
  - `:id`: Mã phiếu (`transaction_id`, VD: `PX-20261008-001`) hoặc Số chứng từ (`reference_number`, VD: `HD-BL-2026-0012`).
- **Ví dụ gọi**: `GET http://localhost:3001/transactions/stock-out/PX-20261008-001`

---

### 5.3. Tạo mới phiếu xuất kho (Mục 5.4.4 Quyết định 806)
Tạo giao dịch xuất kho (bán lẻ, trả lại nhà cung cấp, hủy thuốc hỏng/hết hạn, điều chuyển kho...). Khi tạo mới thành công, server sẽ:
1. Đăng ký giao dịch với trạng thái ban đầu: `status: "accepted"`, `is_synced: false`.
2. **Tự động lưu vào file lưu trữ**: `ServerCSDL/storage/stock-out-transactions.json` và `ServerCSDL/storage/latest-stock-out-request.json` để bạn tiện mở kiểm tra dữ liệu payload gửi lên bất kỳ lúc nào!

- **Đường dẫn**:
  - `POST http://localhost:3001/phieu-xuat`
  - *(Hoặc)* `POST http://localhost:3001/transactions/stock-out`
  - *(Hoặc)* `POST http://localhost:3001/v2/transactions/stock-out`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>` *(Bắt buộc)*

#### Ví dụ 1: Phiếu xuất bán lẻ cho khách (reason: `sale-retail` hoặc `retail`)
```json
{
  "reference_number": "HD-BL-2026-0012",
  "reason": "retail",
  "note": "Xuất bán lẻ cho khách",
  "items": [
    {
      "drug_id": "VN-22019-19",
      "unit_id": "U002",
      "quantity": 2,
      "batch_no": "PAN-260815",
      "packaging_specifications": "Hộp 15 vỉ x 12 viên",
      "expiry_date": "2028-08-15",
      "price": 36000
    }
  ]
}
```

#### Ví dụ 2: Xuất trả lại nhà cung cấp (reason: `return` hoặc `return-to-supplier`)
```json
{
  "reference_number": "TL-DHG-2026-001",
  "reason": "return",
  "supplier_id": "NCC001",
  "note": "Xuất trả nhà cung cấp do bao bì móp méo",
  "items": [
    {
      "drug_id": "VD-28432-17",
      "unit_id": "U003",
      "quantity": 5,
      "batch_no": "LO-260901",
      "expiry_date": "2028-09-01",
      "price": 72000
    }
  ]
}
```

#### Response Mẫu Thành Công (200 OK / 201 Created):
```json
{
  "code": 200,
  "message": "Tạo phiếu xuất hàng thành công (Sandbox CSDL Dược)",
  "transaction_id": "PX-20261009-4182",
  "status": "accepted",
  "data": {
    "transaction_id": "PX-20261009-4182",
    "transaction_date": "2026-10-09T22:30:00.000",
    "export_date": "2026-10-09",
    "reason": "sale-retail",
    "reference_number": "HD-BL-2026-0012",
    "practice_license_code": "GCN-NT-01294",
    "note": "Xuất bán lẻ cho khách",
    "status": "accepted",
    "is_synced": false,
    "total_amount": 72000,
    "items": [
      {
        "drug_id": "VN-22019-19",
        "drug_name": "Panadol Extra Đỏ",
        "registration_number": "VN-22019-19",
        "unit_id": "U002",
        "unit_name": "Vỉ",
        "quantity": 2,
        "batch_no": "PAN-260815",
        "batch_number": "PAN-260815",
        "packaging_specifications": "Hộp 15 vỉ x 12 viên",
        "expiry_date": "2028-08-15",
        "price": 36000,
        "total_price": 72000,
        "manufacturer": {
          "id": "NSX01",
          "name": "GlaxoSmithKline Dungarvan Ltd.",
          "country": "IRL"
        }
      }
    ],
    "created_at": "2026-10-09T22:30:00.000Z",
    "updated_at": "2026-10-09T22:30:00.000Z"
  }
}
```

---

### 5.4. Cập nhật phiếu xuất kho (PUT)
Sửa thông tin phiếu xuất **khi chưa liên thông** (`is_synced: false`).

- **Đường dẫn**:
  - `PUT http://localhost:3001/phieu-xuat/:id`
  - *(Hoặc)* `PUT http://localhost:3001/transactions/stock-out/:id`
- **Headers**:
  - `Authorization: Bearer <access_token>` *(Bắt buộc)*
- **Params**:
  - `:id`: Mã phiếu xuất cần sửa.
- **Request Body**: *(Truyền các trường muốn cập nhật)*
```json
{
  "note": "Cập nhật lại số lượng xuất bán",
  "reference_number": "HD-BL-2026-0012-EDIT"
}
```

#### ⚠️ Quy định chặn sửa khi đã liên thông:
Nếu phiếu đã liên thông lên CSDL Dược Quốc Gia (`is_synced: true` hoặc `status: "completed"`), Server sẽ **từ chối và trả về lỗi 400 Bad Request**:
```json
{
  "statusCode": 400,
  "error": "SYNCED_TRANSACTION_IMMUTABLE",
  "error_description": "Phiếu xuất PX-20261008-001 đã liên thông lên CSDL Dược Quốc Gia (status: completed), không thể chỉnh sửa trực tiếp. Vui lòng lập phiếu điều chỉnh nếu cần thay đổi dữ liệu."
}
```

---

### 5.5. Xóa phiếu xuất kho (DELETE)
Chỉ cho phép xóa phiếu **khi chưa liên thông** (`is_synced: false`).

- **Đường dẫn**:
  - `DELETE http://localhost:3001/phieu-xuat/:id`
  - *(Hoặc)* `DELETE http://localhost:3001/transactions/stock-out/:id`
- **Headers**:
  - `Authorization: Bearer <access_token>` *(Bắt buộc)*
- **Params**:
  - `:id`: Mã phiếu cần xóa.
- **Response Thành Công (200 OK)**:
```json
{
  "code": 200,
  "message": "Đã xóa thành công phiếu xuất PX-20261009-4182",
  "transaction_id": "PX-20261009-4182"
}
```

---

### 5.6. Liên thông phiếu xuất lên CSDL Dược Quốc Gia
Mô phỏng hành động đẩy phiếu xuất lên Cổng Dược Quốc Gia. Trạng thái phiếu sẽ chuyển sang `completed`, `is_synced: true` và nhận được mã biên nhận `national_sync_id`.

- **Cách 1: Truyền mã phiếu trong URL**
  - `POST http://localhost:3001/phieu-xuat/:id/lien-thong`
  - *(Hoặc)* `POST http://localhost:3001/transactions/stock-out/:id/sync`
- **Cách 2: Truyền mã phiếu trong Body**
  - `POST http://localhost:3001/phieu-xuat/lien-thong`
  - `POST http://localhost:3001/v2/transactions/stock-out/sync`
  - **Body**: `{ "transaction_id": "PX-20261009-4182" }`
- **Headers**:
  - `Authorization: Bearer <access_token>` *(Bắt buộc)*
- **Response Mẫu (200 OK)**:
```json
{
  "code": 200,
  "status": "completed",
  "message": "Liên thông phiếu xuất thành công lên Cổng CSDL Dược Quốc Gia",
  "transaction_id": "PX-20261009-4182",
  "national_sync_id": "CSDLD-SYNC-1791560970077-4764",
  "synced_at": "2026-10-09T22:31:00.123Z",
  "data": {
    "transaction_id": "PX-20261009-4182",
    "status": "completed",
    "is_synced": true,
    "national_sync_id": "CSDLD-SYNC-1791560970077-4764",
    "synced_at": "2026-10-09T22:31:00.123Z"
  }
}
```

---

### 5.7. Kiểm tra trạng thái xử lý phiếu xuất (Mục 5.4.6 Quyết định 806)
Theo dõi tình trạng tiếp nhận dữ liệu của hệ thống Quốc Gia theo đúng quy chuẩn Mục 5.4.6.

- **Đường dẫn**:
  - `GET http://localhost:3001/phieu-xuat/:id/status`
  - *(Hoặc)* `GET http://localhost:3001/transactions/stock-out/:id/status`
  - *(Hoặc)* `GET http://localhost:3001/v2/transactions/stock-out/:id/status`
- **Headers**:
  - `Authorization: Bearer <access_token>` *(Bắt buộc)*
- **Params**:
  - `:id`: Mã phiếu xuất (`transaction_id`).
- **Response Mẫu (200 OK)**:
```json
{
  "transaction_id": "PX-20261009-4182",
  "status": "completed",
  "is_synced": true,
  "synced_at": "2026-10-09T22:31:00.123Z",
  "national_sync_id": "CSDLD-SYNC-1791560970077-4764",
  "messages": [
    "Phiếu xuất đã được xử lý và liên thông thành công lên Cổng CSDL Dược Quốc Gia"
  ],
  "submitted_at": "2026-10-09T22:30:00.000Z",
  "message": "Phiếu xuất đã được xử lý và liên thông thành công"
}
```

---

### 5.8. Vị trí lưu trữ dữ liệu để kiểm tra (Persistence Storage)
Mỗi khi một phiếu xuất hoặc phiếu nhập được gửi lên, liên thông hoặc cập nhật, hệ thống tự động ghi nhận vào các file JSON trong thư mục `ServerCSDL/storage/`:
- **Phiếu xuất kho**:
  - **`ServerCSDL/storage/stock-out-transactions.json`**: Chứa toàn bộ danh sách phiếu xuất hiện có trên hệ thống, không bị mất khi restart server.
  - **`ServerCSDL/storage/latest-stock-out-request.json`**: Chứa dữ liệu request thô vừa gửi lên gần nhất (kèm timestamp, transaction_id, raw_body_received và saved_transaction) giúp kiểm tra chính xác giá trị và format payload client gửi lên.
- **Phiếu nhập kho**:
  - **`ServerCSDL/storage/stock-in-transactions.json`**: Chứa toàn bộ danh sách phiếu nhập hiện có trên hệ thống, không bị mất khi restart server.
  - **`ServerCSDL/storage/latest-stock-in-request.json`**: Chứa dữ liệu request thô khi client liên thông / tạo phiếu nhập gần nhất (kèm timestamp, transaction_id, raw_body_received với đầy đủ format + giá trị của request body mà client gửi lên, và saved_transaction).
  - **`ServerCSDL/storage/stock-in/`**: Thư mục chứa các bản sao `stock-in-transactions.json` và `latest-stock-in-request.json` phục vụ tra cứu linh hoạt.

---

## 6. BẢNG MÃ QUY CHUẨN (QUYẾT ĐỊNH 806)

### 6.1. Bảng mã trạng thái tiếp nhận (`status`) - Mục 6.2
| Mã giá trị | Ý nghĩa | Hành động Frontend gợi ý |
| :--- | :--- | :--- |
| `accepted` | Dữ liệu đã được hệ thống tiếp nhận (Lưu nháp / Chưa liên thông). | Cho phép Sửa, Xóa, Bấm nút "Liên thông". |
| `processing` | Dữ liệu đang trong tiến trình xử lý trên Cổng. | Hiển thị spinner / vô hiệu hóa các nút thao tác. |
| `completed` | Dữ liệu đã xử lý và liên thông hoàn tất. | Hiển thị Badge xanh "Đã liên thông", **Khóa sửa/xóa**. |
| `rejected` | Hệ thống từ chối do vi phạm quy tắc dữ liệu. | Hiển thị thông báo đỏ và cho phép sửa lại. |
| `error` | Có lỗi hệ thống trong quá trình xử lý. | Báo lỗi kết nối CSDL Quốc Gia. |

### 6.2. Bảng lý do nhập hàng (`reason`) - Mục 6.4.1
| Mã giá trị | Ý nghĩa |
| :--- | :--- |
| `supplier` | Nhập từ nhà cung cấp (mặc định) |
| `return` | Nhập trả lại từ khách hàng |
| `opening-balance` | Nhập tồn đầu kỳ khi bắt đầu vận hành phần mềm |
| `transfer-in` | Nhập điều chuyển từ chi nhánh/kho khác |
| `other` | Nhập khác |

### 6.3. Bảng lý do xuất hàng (`reason`) - Mục 6.4.2
| Mã giá trị | Tên hiển thị | Đối tượng áp dụng | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `sale-retail` *(hoặc `retail`)* | Xuất bán lẻ | Cơ sở bán lẻ / Nhà thuốc | Xuất bán cho khách hàng vãng lai hoặc bệnh nhân có/không có đơn thuốc |
| `return` *(hoặc `return-to-supplier`)* | Xuất trả lại nhà cung cấp | Toàn bộ cơ sở | Xuất trả lại hàng cho công ty dược do cận date, lỗi tem mác, hỏng |
| `destroy` | Xuất hủy | Toàn bộ cơ sở | Xuất hủy thuốc hết hạn, vỡ hỏng theo biên bản hủy thuốc GPP |
| `transfer-out` | Xuất điều chuyển | Chuỗi nhà thuốc / Có nhiều kho | Xuất chuyển kho nội bộ hoặc chuyển sang chi nhánh khác |
| `sale-wholesale` | Xuất bán buôn | Cơ sở phân phối / Bán buôn | Xuất hóa đơn bán buôn cho đại lý / quầy thuốc |
| `recall` | Xuất thu hồi | Toàn bộ cơ sở | Xuất thu hồi theo công văn khẩn của Cục Quản lý Dược / Bộ Y tế |
| `other` | Xuất khác | Toàn bộ cơ sở | Các lý do xuất kho nội bộ khác |

### 6.4. Bảng mã lỗi HTTP (Phụ lục 6.1 QĐ 806)
Các phản hồi lỗi HTTP 400, 401, 403, 404, 429, 500 luôn tuân thủ cấu trúc:
```json
{
  "statusCode": 401,
  "error": "UNAUTHORIZED",
  "message": "Access token hết hạn hoặc không hợp lệ (theo Quyết định 806)",
  "error_description": "Access token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập tại /auth/login để lấy token."
}
```

---

## 7. MẪU CODE CALL API TỪ CLIENT (REACT / TYPESCRIPT)

### Ví dụ sử dụng `axios` cho cả Phiếu Nhập & Phiếu Xuất:
```typescript
import axios from 'axios';

// 1. Tạo instance axios với baseURL
const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gán Bearer Token vào header cho các API giao dịch
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// 2. Xác thực đăng nhập
export const loginCSDL = async (username = 'nhathuoc_viet', password = 'password123') => {
  const res = await api.post('/auth/login', { username, password });
  const token = res.data.access_token;
  setAuthToken(token);
  return res.data;
};

// 3. API Danh mục Master Data
export const fetchDrugs = (keyword = '', regNumber = '') =>
  api.get('/thuoc', { params: { search: keyword, registration_number: regNumber } });

export const fetchUnits = () => api.get('/unit');
export const fetchSuppliers = () => api.get('/nha-cung-cap');
export const fetchDrugGroups = () => api.get('/nhom-thuoc');

// 4. API Phân hệ Phiếu Xuất (Stock-Out)
export const fetchStockOutList = (params?: { search?: string; status?: string; is_synced?: boolean }) =>
  api.get('/transactions/stock-out', { params });

export const getStockOutDetail = (id: string) =>
  api.get(`/transactions/stock-out/${id}`);

export const getStockOutStatus = (id: string) =>
  api.get(`/transactions/stock-out/${id}/status`);

export const createStockOut = (data: {
  reference_number: string;
  reason: 'retail' | 'sale-retail' | 'return' | 'destroy' | 'transfer-out';
  supplier_id?: string;
  note?: string;
  items: Array<{
    drug_id: string | null;
    unit_id: string;
    quantity: number;
    batch_no: string;
    packaging_specifications?: string;
    expiry_date: string;
    price?: number;
  }>;
}) => api.post('/transactions/stock-out', data);

export const syncStockOut = (transactionId: string) =>
  api.post(`/transactions/stock-out/${transactionId}/sync`);

export const updateStockOut = async (transactionId: string, data: any) => {
  try {
    const res = await api.put(`/transactions/stock-out/${transactionId}`, data);
    return res.data;
  } catch (error: any) {
    if (error.response?.data?.error === 'SYNCED_TRANSACTION_IMMUTABLE') {
      alert('Không thể sửa phiếu xuất này vì đã được liên thông lên CSDL Dược Quốc Gia!');
    }
    throw error;
  }
};

export const deleteStockOut = async (transactionId: string) => {
  try {
    const res = await api.delete(`/transactions/stock-out/${transactionId}`);
    return res.data;
  } catch (error: any) {
    if (error.response?.data?.error === 'SYNCED_TRANSACTION_IMMUTABLE') {
      alert('Phiếu xuất đã liên thông lên CSDL Dược Quốc Gia, không thể xóa!');
    }
    throw error;
  }
};
```

