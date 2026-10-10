import { StockOutItem, StockOutReason } from '../../data/types';

export class CreateStockOutDto {
  transaction_date?: string; // Ngày/giờ xuất hàng (YYYY-MM-DD hoặc ISO datetime)
  export_date?: string; // Alias của transaction_date
  reason?: StockOutReason; // 'sale-retail' | 'retail' | 'return' | 'return-to-supplier' | 'destroy' | 'transfer-out' | 'recall' | 'other'
  source_store_id?: string; // Chi nhánh xuất
  source_warehouse_id?: string; // Kho xuất
  target_store_id?: string; // Chi nhánh nhận (transfer-out)
  target_warehouse_id?: string; // Kho nhận (transfer-out)
  supplier_id?: string; // NCC nhận hàng trả lại
  supplier_name?: string;
  partner_name?: string; // Tên đối tác / khách hàng / NCC (alias từ frontend)
  reference_number?: string; // Số hóa đơn / Số chứng từ xuất hàng
  practice_license_code?: string; // Số GCN cơ sở kinh doanh dược
  note?: string; // Ghi chú
  notes?: string; // Alias từ frontend
  items: StockOutItem[]; // Danh sách mặt hàng xuất
}

export class UpdateStockOutDto {
  transaction_date?: string;
  export_date?: string;
  reason?: StockOutReason;
  source_store_id?: string;
  source_warehouse_id?: string;
  target_store_id?: string;
  target_warehouse_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  partner_name?: string;
  reference_number?: string;
  practice_license_code?: string;
  note?: string;
  notes?: string;
  items?: StockOutItem[];
}

export class SyncStockOutDto {
  transaction_id?: string; // Mã phiếu cần liên thông
  reference_number?: string;
}
