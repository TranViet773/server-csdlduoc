import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface StockTakingItem {
  drug_id: string;
  unit_id: string;
  quantity: number;
  batch_no: string;
  packaging_specifications?: string;
  expiry_date: string;
  manufacturer?: {
    id: string;
    name: string;
    country: string;
  };
  gtin?: string;
  price?: number;
  system_quantity: number;
  actual_quantity: number;
}

export interface StockTakingTransaction {
  transaction_id: string;
  transaction_date: string;
  facility_id?: string;
  store_id?: string;
  warehouse_id?: string;
  reference_number: string;
  practice_license_code?: string;
  note?: string;
  status: string;
  created_at: string;
  items: StockTakingItem[];
}

@Injectable()
export class PhieuKiemKhoService {
  private transactions: StockTakingTransaction[] = [];
  private readonly storageFilePath = path.join(process.cwd(), 'data', 'stock-taking.json');

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const data = fs.readFileSync(this.storageFilePath, 'utf-8');
        this.transactions = JSON.parse(data);
      }
    } catch {
      this.transactions = [];
    }
  }

  private persistToStorage() {
    try {
      const dir = path.dirname(this.storageFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.storageFilePath, JSON.stringify(this.transactions, null, 2), 'utf-8');
    } catch {}
  }

  // 1. Tạo mới phiếu kiểm kho (Mục 5.4.7 QĐ 232)
  create(dto: any) {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INVALID_DATA',
        error_description: 'Phiếu kiểm kho phải có ít nhất 1 mặt hàng thuốc (Mục 5.4.7 QĐ 232)',
      });
    }

    if (!dto.reference_number) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INVALID_DATA',
        error_description: 'Trường reference_number (Số chứng từ kiểm kho) là bắt buộc',
      });
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const transactionId = dto.transaction_id || `PKK-${dateStr}-${randCode}`;

    const newTx: StockTakingTransaction = {
      transaction_id: transactionId,
      transaction_date: dto.transaction_date || now.toISOString(),
      facility_id: dto.facility_id || dto.store_id || 'HN-NT-8892',
      store_id: dto.store_id,
      warehouse_id: dto.warehouse_id || 'KHO-01',
      reference_number: dto.reference_number,
      practice_license_code: dto.practice_license_code || 'GCN-HN-00892/GPP',
      note: dto.note || '',
      status: 'accepted',
      created_at: now.toISOString(),
      items: dto.items,
    };

    this.transactions.unshift(newTx);
    this.persistToStorage();

    return {
      transaction_id: transactionId,
      status: 'accepted',
    };
  }

  // 2. Xem chi tiết phiếu kiểm kho (Mục 5.4.8 QĐ 232)
  findById(id: string) {
    const cleanId = id.trim().toLowerCase();
    const found = this.transactions.find(
      (t) =>
        t.transaction_id.toLowerCase() === cleanId ||
        t.reference_number.toLowerCase() === cleanId,
    );

    if (!found) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_TAKING_NOT_FOUND',
        error_description: `Không tìm thấy phiếu kiểm kho với mã '${id}'`,
      });
    }

    return {
      transaction_id: found.transaction_id,
      transaction_date: found.transaction_date,
      facility_id: found.facility_id,
      warehouse_id: found.warehouse_id,
      reference_number: found.reference_number,
      note: found.note,
      items: found.items,
    };
  }

  // 3. Xem trạng thái xử lý phiếu kiểm kho (Mục 5.4.9 QĐ 232)
  getStatus(id: string) {
    const found = this.findById(id);
    return {
      transaction_id: found.transaction_id,
      status: 'completed',
      messages: [],
      submitted_at: found.transaction_date,
    };
  }
}
