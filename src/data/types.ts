// Định nghĩa kiểu dữ liệu theo Quyết định 806 / CSDL Dược Quốc Gia (v2)

export interface MasterUnit {
  id: string; // Mã đơn vị tính
  name: string; // Tên đơn vị tính (Viên, Hộp, Vỉ, Chai...)
}

export interface DrugRoute {
  id: string; // Mã đường dùng
  name: string; // Uống, Tiêm, Bôi ngoài da...
}

export interface DrugPackaging {
  unit_id: string;
  unit_name: string;
  gtin?: string;
}

export interface DrugManufacturer {
  id: string;
  name: string;
  country: string;
  address?: string;
}

export interface MasterDrug {
  id: string; // Mã định danh thuốc (VD: VN-22019-19)
  name: string; // Tên thuốc
  drug_group_id: string; // Mã nhóm thuốc
  drug_group_name?: string; // Tên nhóm thuốc
  registration_number: string; // Số giấy phép lưu hành (SĐK)
  old_registration_number?: string;
  active_pharmaceutical_ingredient: string; // Hoạt chất (Paracetamol, Amoxicillin...)
  strength: string; // Hàm lượng (500mg, 250mg/5ml...)
  routes: DrugRoute[]; // Đường dùng
  prescription_status: number; // 0: Không kê đơn (OTC), 1: Kê đơn (Rx/ETC)
  special_control_type: number; // 0: Không KSĐB, 1: Gây nghiện, 2: Hướng thần, 3: Tiền chất
  packagings: DrugPackaging[]; // Quy cách đóng gói & đơn vị
  last_update_time?: string;
  manufacturer: DrugManufacturer;
  approval_date?: string;
  expiry_date?: string;
}

export interface MasterDrugGroup {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  tax_code?: string;
  phone?: string;
  address?: string;
}

export interface StockInItem {
  drug_id?: string | null; // Mã thuốc Quốc gia (hoặc null/CUSTOM_DRUG nếu thuốc tự tạo)
  drug_name?: string; // Tên thuốc
  registration_number?: string; // Số đăng ký lưu hành
  unit_id: string; // Mã đơn vị tính
  unit_name?: string; // Tên đơn vị tính
  quantity: number; // Số lượng nhập
  batch_no: string; // Số lô (hoặc alias batch_number)
  batch_number?: string; // Alias tương thích
  packaging_specifications?: string; // Quy cách đóng gói
  expiry_date: string; // Hạn dùng (YYYY-MM-DD)
  manufacturer?: DrugManufacturer;
  gtin?: string;
  price: number; // Đơn giá nhập
  total_price?: number; // Thành tiền
  is_custom_drug?: boolean; // Đánh dấu thuốc tự khai báo ngoài danh mục
}

export type StockInReason = 'supplier' | 'opening-balance' | 'return' | 'transfer-in' | 'other';
export type ProcessingStatus = 'accepted' | 'processing' | 'completed' | 'rejected' | 'error';

// Lý do xuất hàng theo Mục 6.4.2 QĐ 806 (Hỗ trợ cả alias retail, return-to-supplier)
export type StockOutReason =
  | 'sale-retail'
  | 'retail'
  | 'sale-wholesale'
  | 'return'
  | 'return-to-supplier'
  | 'destroy'
  | 'transfer-out'
  | 'recall'
  | 'other';

export interface StockInTransaction {
  transaction_id: string; // Mã phiếu nhập (UUID hoặc định dạng PN-YYYYMMDD-XXX)
  transaction_date: string; // Ngày nhập hàng (YYYY-MM-DD hoặc YYYY-MM-DDThh:mm:ss)
  import_date?: string; // Alias ngày nhập hàng
  reason: StockInReason; // Lý do nhập (mục 6.4.1)
  supplier_id?: string;
  supplier_name?: string;
  source_store_id?: string;
  source_warehouse_id?: string;
  target_store_id?: string;
  target_warehouse_id?: string;
  reference_number: string; // Số chứng từ / hóa đơn nhập
  invoice_date?: string; // Ngày lập hóa đơn VAT (YYYY-MM-DD)
  practice_license_code?: string; // Số GCN đủ điều kiện kinh doanh dược
  note?: string;
  status: ProcessingStatus; // Trạng thái xử lý theo mục 6.2 (accepted, completed...)
  is_synced: boolean; // Trạng thái liên thông với CSDL Dược QG
  synced_at?: string; // Thời điểm liên thông
  national_sync_id?: string; // Mã tiếp nhận từ Cổng Dược Quốc Gia
  items: StockInItem[];
  total_amount?: number;
  created_at: string;
  updated_at: string;
}

// Mục 5.4.4 & 5.4.5 QĐ 806: Chi tiết mặt hàng trong phiếu xuất
export interface StockOutItem {
  drug_id?: string | null; // Mã định danh thuốc Quốc gia (VD: VN-22019-19) hoặc null/CUSTOM_DRUG
  drug_name?: string; // Tên thuốc
  registration_number?: string; // Số đăng ký lưu hành
  unit_id: string; // Mã đơn vị tính (U001, U002...)
  unit_name?: string; // Tên đơn vị tính (Viên, Vỉ, Hộp...)
  quantity: number; // Số lượng xuất
  batch_no: string; // Số lô sản xuất
  batch_number?: string; // Alias tương thích
  packaging_specifications?: string; // Quy cách đóng gói (VD: Hộp 15 vỉ x 12 viên)
  expiry_date: string; // Hạn dùng (YYYY-MM-DD)
  manufacturer?: DrugManufacturer;
  gtin?: string; // Mã GTIN đóng gói
  price?: number; // Đơn giá xuất
  total_price?: number; // Thành tiền xuất
  is_custom_drug?: boolean; // Đánh dấu thuốc tự khai báo ngoài danh mục
}

// Mục 5.4.4 & 5.4.5 QĐ 806: Cấu trúc phiếu xuất hàng (Stock-Out Transaction)
export interface StockOutTransaction {
  transaction_id: string; // Mã phiếu xuất (VD: PX-20261009-001)
  transaction_date: string; // Ngày xuất hàng (YYYY-MM-DD hoặc ISO datetime)
  export_date?: string; // Alias ngày xuất
  reason: StockOutReason; // Lý do xuất hàng theo mục 6.4.2
  source_store_id?: string; // Mã định danh chi nhánh xuất (nếu có chuỗi)
  source_warehouse_id?: string; // Mã kho xuất
  target_store_id?: string; // Mã định danh chi nhánh nhập (transfer-out)
  target_warehouse_id?: string; // Mã kho nhập (transfer-out)
  supplier_id?: string; // Mã NCC nếu reason là 'return'
  supplier_name?: string;
  reference_number: string; // Số chứng từ xuất / số hóa đơn bán lẻ
  practice_license_code?: string; // Số GCN đủ điều kiện kinh doanh dược
  note?: string; // Ghi chú
  status: ProcessingStatus; // accepted, processing, completed, rejected, error (mục 6.2)
  is_synced: boolean; // Trạng thái liên thông CSDL Dược QG
  synced_at?: string; // Thời gian liên thông
  national_sync_id?: string; // Mã tiếp nhận CSDL Dược QG
  items: StockOutItem[]; // Danh sách thuốc xuất
  total_amount?: number; // Tổng tiền phiếu xuất
  created_at: string;
  updated_at: string;
}

