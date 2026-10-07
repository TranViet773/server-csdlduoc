import { StockInItem, StockInReason } from '../../data/types';

export class CreateStockInDto {
  transaction_date?: string; // Ngày/giờ nhập hàng (YYYY-MM-DD hoặc ISO datetime)
  import_date?: string; // Alias của transaction_date
  reason?: StockInReason; // 'supplier' | 'opening-balance' | 'return' | 'transfer-in' | 'other'
  supplier_id?: string;
  supplier_name?: string;
  source_store_id?: string;
  source_warehouse_id?: string;
  target_store_id?: string;
  target_warehouse_id?: string;
  reference_number?: string; // Số chứng từ / Số hóa đơn nhập hàng
  invoice_date?: string; // Ngày lập hóa đơn VAT (YYYY-MM-DD)
  practice_license_code?: string; // Số GCN cơ sở
  note?: string;
  items: StockInItem[];
}

export class UpdateStockInDto {
  transaction_date?: string;
  import_date?: string;
  reason?: StockInReason;
  supplier_id?: string;
  supplier_name?: string;
  reference_number?: string;
  invoice_date?: string;
  practice_license_code?: string;
  note?: string;
  items?: StockInItem[];
}

export class SyncStockInDto {
  transaction_id?: string; // Mã phiếu cần liên thông
  reference_number?: string;
}
