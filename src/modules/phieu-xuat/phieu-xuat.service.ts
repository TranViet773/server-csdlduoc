import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { initialStockOutTransactions, mockDrugs, mockUnits, mockSuppliers } from '../../data/mockData';
import { StockOutTransaction, StockOutItem, StockOutReason } from '../../data/types';
import { CreateStockOutDto, UpdateStockOutDto, SyncStockOutDto } from './phieu-xuat.dto';

@Injectable()
export class PhieuXuatService {
  private readonly storageDir = path.resolve(process.cwd(), 'storage');
  private readonly storageFilePath = path.join(this.storageDir, 'stock-out-transactions.json');
  private readonly latestRequestFilePath = path.join(this.storageDir, 'latest-stock-out-request.json');

  // Danh sách giao dịch phiếu xuất trong bộ nhớ
  private transactions: StockOutTransaction[] = [];

  constructor() {
    this.ensureStorageDirectory();
    this.loadTransactionsFromStorage();
  }

  /**
   * Đảm bảo thư mục lưu trữ `storage` tồn tại ở thư mục gốc ServerCSDL
   */
  private ensureStorageDirectory() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (err) {
      console.error('[Phiếu Xuất] Lỗi tạo thư mục storage:', err);
    }
  }

  /**
   * Khởi tạo dữ liệu: Đọc từ file `storage/stock-out-transactions.json` nếu có,
   * hoặc dùng dữ liệu ban đầu `initialStockOutTransactions`
   */
  private loadTransactionsFromStorage() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const fileContent = fs.readFileSync(this.storageFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.transactions = parsed;
          console.log(`[Phiếu Xuất] Đã tải ${this.transactions.length} phiếu xuất từ file lưu trữ: ${this.storageFilePath}`);
          return;
        }
      }
    } catch (err) {
      console.warn('[Phiếu Xuất] Không thể đọc file lưu trữ, sử dụng mock data ban đầu:', err);
    }

    // Nếu chưa có file lưu trữ, nạp mockData mặc định và ghi ra file
    this.transactions = JSON.parse(JSON.stringify(initialStockOutTransactions));
    this.persistToStorage();
  }

  /**
   * Ghi toàn bộ danh sách phiếu xuất hiện tại ra file JSON để lưu lại
   */
  private persistToStorage() {
    try {
      this.ensureStorageDirectory();
      fs.writeFileSync(this.storageFilePath, JSON.stringify(this.transactions, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Phiếu Xuất] Lỗi lưu trữ vào file:', err);
    }
  }

  /**
   * Lưu payload request gửi lên vào file `latest-stock-out-request.json` để tiện kiểm tra
   */
  private saveLatestRequest(dto: any, rawTransaction: StockOutTransaction) {
    try {
      this.ensureStorageDirectory();
      const dump = {
        received_at: new Date().toISOString(),
        transaction_id: rawTransaction.transaction_id,
        reference_number: rawTransaction.reference_number,
        raw_body_received: dto,
        saved_transaction: rawTransaction,
      };
      fs.writeFileSync(this.latestRequestFilePath, JSON.stringify(dump, null, 2), 'utf-8');
      console.log(`[Phiếu Xuất] ✅ Đã lưu request vừa nhận vào: ${this.latestRequestFilePath}`);
    } catch (err) {
      console.error('[Phiếu Xuất] Lỗi ghi latest request:', err);
    }
  }

  // 1. Lấy danh sách phiếu xuất: GET /phieu-xuat hoặc GET /transactions/stock-out
  findAll(query?: {
    search?: string;
    q?: string;
    status?: string;
    is_synced?: string | boolean;
    page?: number;
    page_size?: number;
  }) {
    let list = [...this.transactions];

    const keyword = (query?.search || query?.q || '').toLowerCase().trim();
    if (keyword) {
      list = list.filter((t) => {
        const matchId = t.transaction_id.toLowerCase().includes(keyword);
        const matchRef = t.reference_number.toLowerCase().includes(keyword);
        const matchNote = t.note ? t.note.toLowerCase().includes(keyword) : false;
        const matchPartner = t.supplier_name ? t.supplier_name.toLowerCase().includes(keyword) : false;
        const matchItem = t.items.some(
          (it) =>
            (it.drug_name && it.drug_name.toLowerCase().includes(keyword)) ||
            (it.drug_id && it.drug_id.toLowerCase().includes(keyword)) ||
            (it.batch_no && it.batch_no.toLowerCase().includes(keyword)),
        );
        return matchId || matchRef || matchNote || matchPartner || matchItem;
      });
    }

    if (query?.status) {
      const targetStatus = query.status.toLowerCase().trim();
      list = list.filter((t) => t.status.toLowerCase() === targetStatus);
    }

    if (query?.is_synced !== undefined && query?.is_synced !== '') {
      const boolSynced = String(query.is_synced).toLowerCase() === 'true';
      list = list.filter((t) => t.is_synced === boolSynced);
    }

    const page = Number(query?.page) > 0 ? Number(query?.page) : 1;
    const pageSize = Number(query?.page_size) > 0 ? Math.min(Number(query?.page_size), 100) : 20;
    const total = list.length;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);

    return {
      page,
      page_size: pageSize,
      total,
      data: paginated,
    };
  }

  // 2. Xem chi tiết phiếu xuất: GET /phieu-xuat/:id hoặc GET /transactions/stock-out/:id
  findById(id: string): StockOutTransaction {
    const cleanId = id.trim().toLowerCase();
    const found = this.transactions.find(
      (t) =>
        t.transaction_id.toLowerCase() === cleanId ||
        t.reference_number.toLowerCase() === cleanId,
    );

    if (!found) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_OUT_NOT_FOUND',
        error_description: `Không tìm thấy phiếu xuất hàng với mã hoặc số chứng từ "${id}" trên hệ thống CSDL Dược`,
      });
    }

    return found;
  }

  // 3. Xem trạng thái xử lý phiếu xuất: GET /transactions/stock-out/:id/status (Mục 5.4.6 QĐ 232)
  getStatus(id: string) {
    const item = this.findById(id);
    return {
      transaction_id: item.transaction_id,
      status: item.status,
      messages:
        item.status === 'completed'
          ? []
          : ['Dữ liệu đã được hệ thống tiếp nhận để xử lý'],
      submitted_at: item.created_at,
    };
  }

  // 4. Tạo mới phiếu xuất kho: POST /phieu-xuat hoặc POST /transactions/stock-out (Mục 5.4.4 QĐ 806)
  create(dto: CreateStockOutDto) {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INVALID_DATA',
        error_description: 'Danh sách thuốc trong phiếu xuất (items) không được để trống (Mục 5.4.4 QĐ 806)',
      });
    }

    const now = new Date();
    const rawTxDate = dto.transaction_date || dto.export_date;
    const transactionDate = rawTxDate
      ? rawTxDate.includes('T')
        ? rawTxDate
        : `${rawTxDate}T${now.toTimeString().slice(0, 8)}`
      : now.toISOString().replace(/\.\d{3}Z$/, '');

    const exportDate = transactionDate.slice(0, 10);

    // Chuẩn hóa lý do xuất hàng theo Mục 6.4.2
    let reason: StockOutReason = 'sale-retail';
    const rawReason = String(dto.reason || 'retail').toLowerCase().trim();
    if (rawReason === 'retail' || rawReason === 'sale-retail') {
      reason = 'sale-retail';
    } else if (rawReason === 'return' || rawReason === 'return-to-supplier') {
      reason = 'return';
    } else if (rawReason === 'destroy') {
      reason = 'destroy';
    } else if (rawReason === 'transfer-out') {
      reason = 'transfer-out';
    } else if (rawReason === 'sale-wholesale') {
      reason = 'sale-wholesale';
    } else if (rawReason === 'recall') {
      reason = 'recall';
    } else {
      reason = (dto.reason as StockOutReason) || 'other';
    }

    let totalAmount = 0;
    const enrichedItems: StockOutItem[] = dto.items.map((item, index) => {
      const batchNo = (item.batch_no || item.batch_number || '').trim();
      if (!batchNo) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'INVALID_ITEM',
          error_description: `Mục thứ ${index + 1} thiếu số lô sản xuất (batch_no hoặc batch_number) theo chuẩn QĐ 806`,
        });
      }

      if (!item.unit_id) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'INVALID_ITEM',
          error_description: `Mục thứ ${index + 1} thiếu mã đơn vị tính (unit_id)`,
        });
      }

      if (!item.quantity || Number(item.quantity) <= 0) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'INVALID_ITEM',
          error_description: `Mục thứ ${index + 1} có số lượng xuất không hợp lệ (phải > 0)`,
        });
      }

      if (!item.expiry_date) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'INVALID_ITEM',
          error_description: `Mục thứ ${index + 1} thiếu hạn sử dụng (expiry_date, định dạng YYYY-MM-DD)`,
        });
      }

      const isCustomDrug =
        !item.drug_id || item.drug_id === 'CUSTOM_DRUG' || item.is_custom_drug === true;

      let drugName = item.drug_name;
      let regNumber = item.registration_number;
      let finalDrugId = item.drug_id;
      let manufacturer = item.manufacturer;
      let packaging = item.packaging_specifications;

      if (isCustomDrug) {
        if (!drugName || !drugName.trim()) {
          throw new BadRequestException({
            statusCode: 400,
            error: 'INVALID_ITEM',
            error_description: `Mục thứ ${index + 1}: Khi xuất thuốc tự khai báo (không có drug_id), bắt buộc phải có tên thuốc (drug_name)`,
          });
        }
        finalDrugId = item.drug_id || `CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`;
        regNumber = regNumber || 'SĐK-TỰ-KHAI';
      } else {
        // Tra cứu trong danh mục thuốc CSDL Dược Quốc Gia
        const foundDrug = mockDrugs.find(
          (d) =>
            d.id.toLowerCase() === item.drug_id!.toLowerCase() ||
            d.registration_number.toLowerCase() === item.drug_id!.toLowerCase(),
        );

        if (foundDrug) {
          drugName = drugName || foundDrug.name;
          regNumber = regNumber || foundDrug.registration_number;
          manufacturer = manufacturer || foundDrug.manufacturer;
          if (!packaging && foundDrug.packagings?.length) {
            packaging = foundDrug.packagings.map((p) => p.unit_name).join(', ');
          }
        } else {
          drugName = drugName || 'Thuốc ngoài danh mục';
        }
      }

      // Tra cứu đơn vị tính
      const foundUnit = mockUnits.find((u) => u.id.toLowerCase() === item.unit_id.toLowerCase());
      const unitName = item.unit_name || foundUnit?.name || 'Đơn vị';

      const itemPrice = Number(item.price) || 0;
      const itemQty = Number(item.quantity) || 1;
      const lineTotal = itemPrice * itemQty;
      totalAmount += lineTotal;

      return {
        ...item,
        drug_id: finalDrugId,
        drug_name: drugName,
        registration_number: regNumber,
        unit_id: item.unit_id,
        unit_name: unitName,
        batch_no: batchNo,
        batch_number: batchNo,
        packaging_specifications: packaging,
        price: itemPrice,
        quantity: itemQty,
        total_price: lineTotal,
        manufacturer,
        is_custom_drug: isCustomDrug,
      };
    });

    const dateStr = transactionDate.slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const transactionId = `PX-${dateStr}-${randCode}`;

    // Tìm tên NCC nếu là xuất trả NCC
    let supplierName = dto.supplier_name || dto.partner_name;
    if (!supplierName && dto.supplier_id) {
      const foundSup = mockSuppliers.find((s) => s.id === dto.supplier_id);
      if (foundSup) supplierName = foundSup.name;
    }

    const note = dto.note || dto.notes || '';

    const newTransaction: StockOutTransaction = {
      transaction_id: transactionId,
      transaction_date: transactionDate,
      export_date: exportDate,
      reason,
      source_store_id: dto.source_store_id,
      source_warehouse_id: dto.source_warehouse_id,
      target_store_id: dto.target_store_id,
      target_warehouse_id: dto.target_warehouse_id,
      supplier_id: dto.supplier_id,
      supplier_name: supplierName,
      reference_number: dto.reference_number || `HD-BL-${dateStr}-${randCode}`,
      practice_license_code: dto.practice_license_code || 'GCN-NT-01294',
      note,
      status: 'accepted', // Ban đầu là accepted (Lưu nháp / Chưa liên thông)
      is_synced: false,
      items: enrichedItems,
      total_amount: totalAmount,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // Đưa vào đầu mảng và ghi ra file lưu trữ
    this.transactions.unshift(newTransaction);
    this.persistToStorage();
    this.saveLatestRequest(dto, newTransaction);

    console.log(`[Phiếu Xuất] 📦 Nhận phiếu xuất mới thành công! Mã: ${transactionId} (Số CT: ${newTransaction.reference_number}, Tổng tiền: ${totalAmount.toLocaleString()}đ, Số món: ${enrichedItems.length})`);

    return {
      transaction_id: transactionId,
      status: 'accepted',
    };
  }

  // 5. Cập nhật phiếu xuất: PUT /phieu-xuat/:id hoặc PUT /transactions/stock-out/:id
  update(id: string, dto: UpdateStockOutDto) {
    const itemIndex = this.transactions.findIndex(
      (t) =>
        t.transaction_id.toLowerCase() === id.toLowerCase() ||
        t.reference_number.toLowerCase() === id.toLowerCase(),
    );

    if (itemIndex === -1) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_OUT_NOT_FOUND',
        error_description: `Không tìm thấy phiếu xuất với mã "${id}" để cập nhật`,
      });
    }

    const current = this.transactions[itemIndex];

    // CHẶN SỬA KHI PHIẾU ĐÃ ĐƯỢC LIÊN THÔNG LÊN CSDL DƯỢC QUỐC GIA
    if (current.is_synced || current.status === 'completed') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SYNCED_TRANSACTION_IMMUTABLE',
        error_description: `Phiếu xuất ${current.transaction_id} đã liên thông lên CSDL Dược Quốc Gia (status: completed), không thể chỉnh sửa trực tiếp. Vui lòng lập phiếu điều chỉnh nếu cần thay đổi dữ liệu.`,
      });
    }

    if (dto.items && Array.isArray(dto.items)) {
      let totalAmount = 0;
      current.items = dto.items.map((item) => {
        const batchNo = (item.batch_no || item.batch_number || '').trim();
        const foundDrug = item.drug_id
          ? mockDrugs.find(
              (d) =>
                d.id.toLowerCase() === item.drug_id!.toLowerCase() ||
                d.registration_number.toLowerCase() === item.drug_id!.toLowerCase(),
            )
          : null;
        const foundUnit = mockUnits.find((u) => u.id.toLowerCase() === item.unit_id?.toLowerCase());
        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 1;
        const lineTotal = price * qty;
        totalAmount += lineTotal;
        return {
          ...item,
          drug_name: item.drug_name || foundDrug?.name || 'Thuốc ngoài danh mục',
          unit_name: item.unit_name || foundUnit?.name || 'Đơn vị',
          batch_no: batchNo || item.batch_no,
          batch_number: batchNo || item.batch_no,
          price,
          quantity: qty,
          total_price: lineTotal,
        };
      });
      current.total_amount = totalAmount;
    }

    if (dto.transaction_date || dto.export_date) {
      const raw = dto.transaction_date || dto.export_date;
      current.transaction_date = raw!;
      current.export_date = raw!.slice(0, 10);
    }
    if (dto.reason) current.reason = dto.reason;
    if (dto.supplier_id) current.supplier_id = dto.supplier_id;
    if (dto.supplier_name) current.supplier_name = dto.supplier_name;
    if (dto.partner_name) current.supplier_name = dto.partner_name;
    if (dto.reference_number) current.reference_number = dto.reference_number;
    if (dto.practice_license_code) current.practice_license_code = dto.practice_license_code;
    if (dto.note !== undefined) current.note = dto.note;
    if (dto.notes !== undefined) current.note = dto.notes;

    current.updated_at = new Date().toISOString();
    this.transactions[itemIndex] = current;
    this.persistToStorage();

    return {
      code: 200,
      message: 'Cập nhật phiếu xuất thành công',
      data: current,
    };
  }

  // 6. Xóa phiếu xuất: DELETE /phieu-xuat/:id hoặc DELETE /transactions/stock-out/:id
  remove(id: string) {
    const itemIndex = this.transactions.findIndex(
      (t) =>
        t.transaction_id.toLowerCase() === id.toLowerCase() ||
        t.reference_number.toLowerCase() === id.toLowerCase(),
    );

    if (itemIndex === -1) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_OUT_NOT_FOUND',
        error_description: `Không tìm thấy phiếu xuất với mã "${id}" để xóa`,
      });
    }

    const target = this.transactions[itemIndex];

    // CHẶN XÓA KHI PHIẾU ĐÃ ĐƯỢC LIÊN THÔNG LÊN CSDL DƯỢC QUỐC GIA
    if (target.is_synced || target.status === 'completed') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SYNCED_TRANSACTION_IMMUTABLE',
        error_description: `Phiếu xuất ${target.transaction_id} đã liên thông lên CSDL Dược Quốc Gia (status: completed), không thể xóa trực tiếp.`,
      });
    }

    const removed = this.transactions.splice(itemIndex, 1)[0];
    this.persistToStorage();

    return {
      code: 200,
      message: `Đã xóa thành công phiếu xuất ${removed.transaction_id}`,
      transaction_id: removed.transaction_id,
    };
  }

  // 7. Liên thông phiếu xuất lên CSDL Dược Quốc Gia: POST /phieu-xuat/lien-thong hoặc POST /transactions/stock-out/:id/sync
  sync(idOrDto: string | SyncStockOutDto) {
    let id: string | undefined;
    if (typeof idOrDto === 'string') {
      id = idOrDto;
    } else if (idOrDto && typeof idOrDto === 'object') {
      id = idOrDto.transaction_id || idOrDto.reference_number;
    }

    if (!id) {
      const pending = this.transactions.find((t) => !t.is_synced);
      if (pending) {
        id = pending.transaction_id;
      } else {
        throw new BadRequestException({
          statusCode: 400,
          error: 'MISSING_TRANSACTION_ID',
          error_description: 'Vui lòng cung cấp mã transaction_id của phiếu xuất cần liên thông',
        });
      }
    }

    const item = this.findById(id);
    const now = new Date();
    const nationalSyncId = `CSDLD-SYNC-${now.getTime()}-${Math.floor(1000 + Math.random() * 9000)}`;

    item.is_synced = true;
    item.status = 'completed'; // Chuyển sang hoàn tất theo chuẩn 806
    item.synced_at = now.toISOString();
    item.national_sync_id = nationalSyncId;
    item.updated_at = now.toISOString();

    this.persistToStorage();

    return {
      code: 200,
      status: 'completed',
      message: 'Liên thông phiếu xuất thành công lên Cổng CSDL Dược Quốc Gia',
      transaction_id: item.transaction_id,
      national_sync_id: nationalSyncId,
      synced_at: item.synced_at,
      data: item,
    };
  }
}
