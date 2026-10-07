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

- **Response Mẫu (200 OK)**:
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

## 5. BẢNG MÃ QUY CHUẨN (QUYẾT ĐỊNH 806)

### 5.1. Bảng mã trạng thái tiếp nhận (`status`) - Mục 6.2
| Mã giá trị | Ý nghĩa | Hành động Frontend gợi ý |
| :--- | :--- | :--- |
| `accepted` | Dữ liệu đã được hệ thống tiếp nhận (Lưu nháp / Chưa liên thông). | Cho phép Sửa, Xóa, Bấm nút "Liên thông". |
| `processing` | Dữ liệu đang trong tiến trình xử lý trên Cổng. | Hiển thị spinner / vô hiệu hóa các nút thao tác. |
| `completed` | Dữ liệu đã xử lý và liên thông hoàn tất. | Hiển thị Badge xanh "Đã liên thông", **Khóa sửa/xóa**. |
| `rejected` | Hệ thống từ chối do vi phạm quy tắc dữ liệu. | Hiển thị thông báo đỏ và cho phép sửa lại. |
| `error` | Có lỗi hệ thống trong quá trình xử lý. | Báo lỗi kết nối CSDL Quốc Gia. |

### 5.2. Bảng lý do nhập hàng (`reason`) - Mục 6.4.1
| Mã giá trị | Ý nghĩa |
| :--- | :--- |
| `supplier` | Nhập từ nhà cung cấp (mặc định) |
| `return` | Nhập trả lại từ khách hàng |
| `opening-balance` | Nhập tồn đầu kỳ khi bắt đầu vận hành phần mềm |
| `transfer-in` | Nhập điều chuyển từ chi nhánh/kho khác |
| `other` | Nhập khác |

---

## 6. MẪU CODE CALL API TỪ CLIENT (REACT / TYPESCRIPT)

### Ví dụ sử dụng `axios`:
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Lấy danh sách thuốc hoặc tìm kiếm theo Số đăng ký / Từ khóa
export const fetchDrugs = (keyword = '', regNumber = '') =>
  api.get('/thuoc', {
    params: {
      search: keyword,
      registration_number: regNumber,
    },
  });

// 2. Lấy danh sách đơn vị tính
export const fetchUnits = () => api.get('/unit');

// 3. Tạo mới phiếu nhập (hỗ trợ cả thuốc trong CSDL và thuốc tự tạo)
export const createStockIn = (data: {
  transaction_date?: string;
  invoice_date?: string;
  reference_number: string;
  supplier_name?: string;
  items: Array<{
    drug_id: string | null;
    drug_name?: string;
    registration_number?: string;
    unit_id: string;
    quantity: number;
    batch_no: string; // hoặc batch_number
    expiry_date: string;
    price?: number;
  }>;
}) => api.post('/phieu-nhap', data);

// 4. Liên thông phiếu nhập lên CSDL Dược Quốc Gia
export const syncStockIn = (transactionId: string) =>
  api.post(`/phieu-nhap/${transactionId}/lien-thong`);

// 5. Cập nhật phiếu nhập (có bắt lỗi chặn khi đã liên thông)
export const updateStockIn = async (transactionId: string, data: any) => {
  try {
    const res = await api.put(`/phieu-nhap/${transactionId}`, data);
    return res.data;
  } catch (error: any) {
    if (error.response?.data?.error === 'SYNCED_TRANSACTION_IMMUTABLE') {
      alert('Không thể sửa phiếu này vì đã được liên thông lên CSDL Dược Quốc Gia!');
    }
    throw error;
  }
};

// 6. Xóa phiếu nhập (có bắt lỗi chặn khi đã liên thông)
export const deleteStockIn = async (transactionId: string) => {
  try {
    const res = await api.delete(`/phieu-nhap/${transactionId}`);
    return res.data;
  } catch (error: any) {
    if (error.response?.data?.error === 'SYNCED_TRANSACTION_IMMUTABLE') {
      alert('Phiếu đã liên thông lên CSDL Dược Quốc Gia, không thể xóa!');
    }
    throw error;
  }
};
```
