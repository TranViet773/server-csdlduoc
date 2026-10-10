import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { initialStockInTransactions, mockDrugs, mockUnits, mockSuppliers } from '../../data/mockData';
import { StockInTransaction, StockInItem, StockInReason } from '../../data/types';
import { CreateStockInDto, UpdateStockInDto, SyncStockInDto } from './phieu-nhap.dto';

@Injectable()
export class PhieuNhapService {
  private readonly storageDir = path.resolve(process.cwd(), 'storage');
  private readonly storageFilePath = path.join(this.storageDir, 'stock-in-transactions.json');
  private readonly latestRequestFilePath = path.join(this.storageDir, 'latest-stock-in-request.json');

  // Thư mục bổ trợ storage/stock-in/ để hỗ trợ truy xuất linh hoạt
  private readonly stockInDir = path.join(this.storageDir, 'stock-in');
  private readonly stockInDirTransactionsFile = path.join(this.stockInDir, 'stock-in-transactions.json');
  private readonly stockInDirLatestRequestFile = path.join(this.stockInDir, 'latest-stock-in-request.json');

  // Danh sách giao dịch phiếu nhập trong bộ nhớ
  private transactions: StockInTransaction[] = [];

  constructor() {
    this.ensureStorageDirectory();
    this.loadTransactionsFromStorage();
  }

  /**
   * Đảm bảo thư mục lưu trữ `storage` và `storage/stock-in` tồn tại ở thư mục gốc ServerCSDL
   */
  private ensureStorageDirectory() {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      if (!fs.existsSync(this.stockInDir)) {
        fs.mkdirSync(this.stockInDir, { recursive: true });
      }
    } catch (err) {
      console.error('[Phiếu Nhập] Lỗi tạo thư mục storage:', err);
    }
  }

  /**
   * Khởi tạo dữ liệu: Đọc từ file `storage/stock-in-transactions.json` nếu có,
   * hoặc dùng dữ liệu ban đầu `initialStockInTransactions`
   */
  private loadTransactionsFromStorage() {
    try {
      let fileToRead = this.storageFilePath;
      if (!fs.existsSync(fileToRead) && fs.existsSync(this.stockInDirTransactionsFile)) {
        fileToRead = this.stockInDirTransactionsFile;
      }

      if (fs.existsSync(fileToRead)) {
        const fileContent = fs.readFileSync(fileToRead, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.transactions = parsed;
          console.log(`[Phiếu Nhập] Đã tải ${this.transactions.length} phiếu nhập từ file lưu trữ: ${fileToRead}`);
          this.initLatestRequestIfNotExist();
          return;
        }
      }
    } catch (err) {
      console.warn('[Phiếu Nhập] Không thể đọc file lưu trữ, sử dụng mock data ban đầu:', err);
    }

    // Nếu chưa có file lưu trữ, nạp mockData mặc định và ghi ra file
    this.transactions = JSON.parse(JSON.stringify(initialStockInTransactions));
    this.persistToStorage();
    this.initLatestRequestIfNotExist();
  }

  /**
   * Ghi toàn bộ danh sách phiếu nhập hiện tại ra file JSON để lưu lại
   */
  private persistToStorage() {
    try {
      this.ensureStorageDirectory();
      const content = JSON.stringify(this.transactions, null, 2);
      fs.writeFileSync(this.storageFilePath, content, 'utf-8');
      fs.writeFileSync(this.stockInDirTransactionsFile, content, 'utf-8');
      fs.writeFileSync(path.join(this.storageDir, 'stock-in.json'), content, 'utf-8');
    } catch (err) {
      console.error('[Phiếu Nhập] Lỗi lưu trữ vào file:', err);
    }
  }

  /**
   * Lưu payload request gửi lên vào file `latest-stock-in-request.json` để tiện kiểm tra:
   * Giữ nguyên giá trị + format của requestbody mà client gửi lên!
   */
  private saveLatestRequest(dto: any, rawTransaction: StockInTransaction) {
    try {
      this.ensureStorageDirectory();

      // Nếu dto không có items (ví dụ chỉ là request sync với { transaction_id }),
      // nhưng file hiện tại đã lưu raw_body_received có items của chính transaction này,
      // thì giữ lại raw_body_received gốc để không làm mất payload chi tiết thuốc.
      let finalRawBody = dto;
      if (
        (!dto || !dto.items || !Array.isArray(dto.items)) &&
        fs.existsSync(this.latestRequestFilePath)
      ) {
        try {
          const currentDump = JSON.parse(fs.readFileSync(this.latestRequestFilePath, 'utf-8'));
          if (
            currentDump.transaction_id === rawTransaction.transaction_id &&
            currentDump.raw_body_received &&
            Array.isArray(currentDump.raw_body_received.items)
          ) {
            finalRawBody = currentDump.raw_body_received;
          }
        } catch {
          // ignore
        }
      }

      const dump = {
        received_at: new Date().toISOString(),
        transaction_id: rawTransaction.transaction_id,
        reference_number: rawTransaction.reference_number,
        raw_body_received: finalRawBody,
        saved_transaction: rawTransaction,
      };

      const content = JSON.stringify(dump, null, 2);
      fs.writeFileSync(this.latestRequestFilePath, content, 'utf-8');
      fs.writeFileSync(this.stockInDirLatestRequestFile, content, 'utf-8');
      fs.writeFileSync(path.join(this.stockInDir, 'latest-request.json'), content, 'utf-8');
      console.log(`[Phiếu Nhập] ✅ Đã lưu request vừa nhận vào: ${this.latestRequestFilePath}`);
    } catch (err) {
      console.error('[Phiếu Nhập] Lỗi ghi latest request:', err);
    }
  }

  /**
   * Tạo latest-stock-in-request.json mặc định nếu chưa có
   */
  private initLatestRequestIfNotExist() {
    try {
      if (!fs.existsSync(this.latestRequestFilePath) && this.transactions.length > 0) {
        const first = this.transactions[0];
        const sampleDto = {
          transaction_id: first.transaction_id,
          transaction_date: first.transaction_date,
          import_date: first.import_date || first.transaction_date.slice(0, 10),
          reason: first.reason,
          reference_number: first.reference_number,
          supplier_id: first.supplier_id,
          supplier_name: first.supplier_name,
          practice_license_code: first.practice_license_code,
          note: first.note,
          items: first.items,
        };
        this.saveLatestRequest(sampleDto, first);
      }
    } catch (err) {
      console.warn('[Phiếu Nhập] Không thể tạo latest request mặc định:', err);
    }
  }

  // 1. Lấy danh sách phiếu nhập: GET /phieu-nhap hoặc GET /transactions/stock-in
  findAll(query?: string | {
    search?: string;
    q?: string;
    status?: string;
    is_synced?: string | boolean;
    page?: number;
    page_size?: number;
  }) {
    let list = [...this.transactions];

    let keyword = '';
    let statusFilter: string | undefined;
    let isSyncedFilter: string | boolean | undefined;
    let page = 1;
    let pageSize = 20;

    if (typeof query === 'string') {
      keyword = query.toLowerCase().trim();
    } else if (query && typeof query === 'object') {
      keyword = (query.search || query.q || '').toLowerCase().trim();
      statusFilter = query.status;
      isSyncedFilter = query.is_synced;
      if (Number(query.page) > 0) page = Number(query.page);
      if (Number(query.page_size) > 0) pageSize = Math.min(Number(query.page_size), 100);
    }

    if (keyword) {
      list = list.filter((t) => {
        const matchId = t.transaction_id.toLowerCase().includes(keyword);
        const matchRef = t.reference_number.toLowerCase().includes(keyword);
        const matchSupplier = t.supplier_name ? t.supplier_name.toLowerCase().includes(keyword) : false;
        const matchNote = t.note ? t.note.toLowerCase().includes(keyword) : false;
        const matchItem = t.items.some(
          (it) =>
            (it.drug_name && it.drug_name.toLowerCase().includes(keyword)) ||
            (it.drug_id && it.drug_id.toLowerCase().includes(keyword)) ||
            (it.batch_no && it.batch_no.toLowerCase().includes(keyword)),
        );
        return matchId || matchRef || matchSupplier || matchNote || matchItem;
      });
    }

    if (statusFilter) {
      const targetStatus = statusFilter.toLowerCase().trim();
      list = list.filter((t) => t.status.toLowerCase() === targetStatus);
    }

    if (isSyncedFilter !== undefined && isSyncedFilter !== '') {
      const boolSynced = String(isSyncedFilter).toLowerCase() === 'true';
      list = list.filter((t) => t.is_synced === boolSynced);
    }

    const total = list.length;
    const paginated = list.slice((page - 1) * pageSize, page * pageSize);

    return {
      page,
      page_size: pageSize,
      total,
      data: paginated,
    };
  }

  // 2. Xem chi tiết phiếu nhập: GET /phieu-nhap/:id hoặc GET /transactions/stock-in/:id
  findById(id: string): StockInTransaction {
    const cleanId = id.trim().toLowerCase();
    const found = this.transactions.find(
      (t) =>
        t.transaction_id.toLowerCase() === cleanId ||
        t.reference_number.toLowerCase() === cleanId,
    );

    if (!found) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_IN_NOT_FOUND',
        error_description: `Không tìm thấy phiếu nhập hàng với mã hoặc số chứng từ "${id}" trên hệ thống CSDL Dược`,
      });
    }

    return found;
  }

  // 3. Xem trạng thái xử lý phiếu nhập: GET /transactions/stock-in/:id/status (Mục 5.4.3 QĐ 806)
  getStatus(id: string) {
    const item = this.findById(id);
    return {
      transaction_id: item.transaction_id,
      status: item.status,
      is_synced: item.is_synced,
      synced_at: item.synced_at || null,
      national_sync_id: item.national_sync_id || null,
      messages:
        item.status === 'completed'
          ? ['Phiếu nhập đã được xử lý và liên thông thành công lên Cổng CSDL Dược Quốc Gia']
          : ['Dữ liệu đã được hệ thống tiếp nhận để xử lý'],
      submitted_at: item.created_at,
      message:
        item.status === 'completed'
          ? 'Phiếu nhập đã được xử lý và liên thông thành công'
          : 'Dữ liệu đã được hệ thống tiếp nhận để xử lý',
    };
  }

  // 4. Tạo mới phiếu nhập kho: POST /phieu-nhap hoặc POST /transactions/stock-in (Mục 5.4.1 QĐ 806)
  create(dto: CreateStockInDto) {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INVALID_DATA',
        error_description: 'Danh sách thuốc trong phiếu nhập (items) không được để trống (Mục 5.4.1 QĐ 806)',
      });
    }

    // Xử lý ngày nhập (transaction_date / import_date)
    const now = new Date();
    const rawTxDate = dto.transaction_date || dto.import_date;
    const transactionDate = rawTxDate
      ? rawTxDate.includes('T')
        ? rawTxDate
        : `${rawTxDate}T${now.toTimeString().slice(0, 8)}`
      : now.toISOString().replace(/\.\d{3}Z$/, '');

    const importDate = transactionDate.slice(0, 10);

    // Chuẩn hóa lý do nhập theo Mục 6.4.1
    let reason: StockInReason = 'supplier';
    const rawReason = String(dto.reason || 'supplier').toLowerCase().trim();
    if (rawReason === 'supplier') {
      reason = 'supplier';
    } else if (rawReason === 'return') {
      reason = 'return';
    } else if (rawReason === 'opening-balance') {
      reason = 'opening-balance';
    } else if (rawReason === 'transfer-in') {
      reason = 'transfer-in';
    } else {
      reason = (dto.reason as StockInReason) || 'other';
    }

    let totalAmount = 0;
    const enrichedItems: StockInItem[] = dto.items.map((item, index) => {
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
          error_description: `Mục thứ ${index + 1} có số lượng không hợp lệ (phải > 0)`,
        });
      }

      if (!item.expiry_date) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'INVALID_ITEM',
          error_description: `Mục thứ ${index + 1} thiếu hạn sử dụng (expiry_date, định dạng YYYY-MM-DD)`,
        });
      }

      // Kiểm tra xem là thuốc trong danh mục hay thuốc ngoài danh mục (Custom Drug)
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
            error_description: `Mục thứ ${index + 1}: Khi nhập thuốc ngoài danh mục (drug_id rỗng), bắt buộc phải có tên thuốc (drug_name)`,
          });
        }
        finalDrugId = item.drug_id || `CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`;
        regNumber = regNumber || 'SĐK-TỰ-KHAI';
      } else {
        // Tra cứu trong danh mục thuốc CSDL Dược Quốc gia
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
        batch_number: batchNo, // alias tương thích
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
    const transactionId = (dto as any).transaction_id || `PN-${dateStr}-${randCode}`;

    // Tìm tên NCC nếu có
    let supplierName = dto.supplier_name || (dto as any).partner_name;
    if (!supplierName && dto.supplier_id) {
      const foundSup = mockSuppliers.find((s) => s.id === dto.supplier_id);
      if (foundSup) supplierName = foundSup.name;
    }

    const note = dto.note || (dto as any).notes || '';

    // Kiểm tra xem transaction_id đã tồn tại chưa để tránh trùng lặp
    const existingIndex = this.transactions.findIndex(
      (t) => t.transaction_id.toLowerCase() === transactionId.toLowerCase(),
    );

    const newTransaction: StockInTransaction = {
      transaction_id: transactionId,
      transaction_date: transactionDate,
      import_date: importDate,
      reason,
      supplier_id: dto.supplier_id,
      supplier_name: supplierName,
      source_store_id: dto.source_store_id,
      source_warehouse_id: dto.source_warehouse_id,
      target_store_id: dto.target_store_id,
      target_warehouse_id: dto.target_warehouse_id,
      reference_number: dto.reference_number || `HD-${dateStr}-${randCode}`,
      invoice_date: dto.invoice_date || importDate,
      practice_license_code: dto.practice_license_code || 'GCN-NT-01294',
      note,
      status: 'accepted', // Ban đầu là accepted (chưa liên thông)
      is_synced: false,
      items: enrichedItems,
      total_amount: totalAmount,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (existingIndex >= 0 && !this.transactions[existingIndex].is_synced) {
      this.transactions[existingIndex] = newTransaction;
    } else {
      this.transactions.unshift(newTransaction);
    }

    this.persistToStorage();
    this.saveLatestRequest(dto, newTransaction);

    console.log(`[Phiếu Nhập] 📦 Nhận phiếu nhập mới thành công! Mã: ${transactionId} (Số CT: ${newTransaction.reference_number}, Tổng tiền: ${totalAmount.toLocaleString()}đ, Số món: ${enrichedItems.length})`);

    return {
      code: 200,
      message: 'Tạo phiếu nhập hàng thành công (Sandbox CSDL Dược)',
      transaction_id: transactionId,
      status: 'accepted',
      data: newTransaction,
    };
  }

  // 5. Cập nhật phiếu nhập: PUT /phieu-nhap/:id hoặc PUT /transactions/stock-in/:id
  update(id: string, dto: UpdateStockInDto) {
    const itemIndex = this.transactions.findIndex(
      (t) =>
        t.transaction_id.toLowerCase() === id.toLowerCase() ||
        t.reference_number.toLowerCase() === id.toLowerCase(),
    );

    if (itemIndex === -1) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_IN_NOT_FOUND',
        error_description: `Không tìm thấy phiếu nhập với mã "${id}" để cập nhật`,
      });
    }

    const current = this.transactions[itemIndex];

    // CHẶN SỬA KHI PHIẾU ĐÃ ĐƯỢC LIÊN THÔNG LÊN CSDL DƯỢC QUỐC GIA
    if (current.is_synced || current.status === 'completed') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SYNCED_TRANSACTION_IMMUTABLE',
        error_description: `Phiếu nhập ${current.transaction_id} đã liên thông lên CSDL Dược Quốc Gia (status: completed), không thể chỉnh sửa trực tiếp. Vui lòng lập phiếu điều chỉnh nếu cần thay đổi dữ liệu.`,
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

    if (dto.transaction_date || dto.import_date) {
      const raw = dto.transaction_date || dto.import_date;
      current.transaction_date = raw!;
      current.import_date = raw!.slice(0, 10);
    }
    if (dto.reason) current.reason = dto.reason;
    if (dto.supplier_id) current.supplier_id = dto.supplier_id;
    if (dto.supplier_name) current.supplier_name = dto.supplier_name;
    if ((dto as any).partner_name) current.supplier_name = (dto as any).partner_name;
    if (dto.reference_number) current.reference_number = dto.reference_number;
    if (dto.invoice_date) current.invoice_date = dto.invoice_date;
    if (dto.practice_license_code) current.practice_license_code = dto.practice_license_code;
    if (dto.note !== undefined) current.note = dto.note;
    if ((dto as any).notes !== undefined) current.note = (dto as any).notes;

    current.updated_at = new Date().toISOString();
    this.transactions[itemIndex] = current;
    this.persistToStorage();

    return {
      code: 200,
      message: 'Cập nhật phiếu nhập thành công',
      data: current,
    };
  }

  // 6. Xóa phiếu nhập: DELETE /phieu-nhap/:id hoặc DELETE /transactions/stock-in/:id
  remove(id: string) {
    const itemIndex = this.transactions.findIndex(
      (t) =>
        t.transaction_id.toLowerCase() === id.toLowerCase() ||
        t.reference_number.toLowerCase() === id.toLowerCase(),
    );

    if (itemIndex === -1) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_IN_NOT_FOUND',
        error_description: `Không tìm thấy phiếu nhập với mã "${id}" để xóa`,
      });
    }

    const target = this.transactions[itemIndex];

    // CHẶN XÓA KHI PHIẾU ĐÃ ĐƯỢC LIÊN THÔNG LÊN CSDL DƯỢC QUỐC GIA
    if (target.is_synced || target.status === 'completed') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'SYNCED_TRANSACTION_IMMUTABLE',
        error_description: `Phiếu nhập ${target.transaction_id} đã liên thông lên CSDL Dược Quốc Gia (status: completed), không thể xóa trực tiếp.`,
      });
    }

    const removed = this.transactions.splice(itemIndex, 1)[0];
    this.persistToStorage();

    return {
      code: 200,
      message: `Đã xóa thành công phiếu nhập ${removed.transaction_id}`,
      transaction_id: removed.transaction_id,
    };
  }

  // 7. Liên thông phiếu nhập lên CSDL Dược Quốc Gia: POST /phieu-nhap/lien-thong hoặc POST /transactions/stock-in/:id/sync
  sync(idOrDto: string | SyncStockInDto | any, rawBody?: any) {
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
          error_description: 'Vui lòng cung cấp mã transaction_id của phiếu nhập cần liên thông',
        });
      }
    }

    let item: StockInTransaction;
    try {
      item = this.findById(id);
    } catch (e) {
      // Trường hợp client gửi liên thông trực tiếp với đầy đủ items mà chưa tạo trước đó
      if (typeof idOrDto === 'object' && Array.isArray(idOrDto.items) && idOrDto.items.length > 0) {
        const created = this.create(idOrDto);
        item = created.data;
      } else {
        throw e;
      }
    }

    const now = new Date();
    const nationalSyncId = `CSDLD-SYNC-${now.getTime()}-${Math.floor(1000 + Math.random() * 9000)}`;

    item.is_synced = true;
    item.status = 'completed'; // Chuyển sang hoàn tất theo chuẩn 806
    item.synced_at = now.toISOString();
    item.national_sync_id = nationalSyncId;
    item.updated_at = now.toISOString();

    this.persistToStorage();

    // Lưu vết request liên thông
    const syncPayload = rawBody || (typeof idOrDto === 'object' ? idOrDto : { transaction_id: id });
    this.saveLatestRequest(syncPayload, item);

    console.log(`[Phiếu Nhập] 🚀 Liên thông thành công phiếu nhập ${item.transaction_id}! Mã QG: ${nationalSyncId}`);

    return {
      code: 200,
      status: 'completed',
      message: 'Liên thông phiếu nhập thành công lên Cổng CSDL Dược Quốc Gia',
      transaction_id: item.transaction_id,
      national_sync_id: nationalSyncId,
      synced_at: item.synced_at,
      data: item,
    };
  }
}
