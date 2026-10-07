import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { initialStockInTransactions, mockDrugs, mockUnits, mockSuppliers } from '../../data/mockData';
import { StockInTransaction, StockInItem } from '../../data/types';
import { CreateStockInDto, UpdateStockInDto, SyncStockInDto } from './phieu-nhap.dto';

@Injectable()
export class PhieuNhapService {
  // Bộ nhớ in-memory khởi tạo từ mockData để hỗ trợ CRUD trong phiên làm việc
  private transactions: StockInTransaction[] = JSON.parse(JSON.stringify(initialStockInTransactions));

  // Lấy danh sách phiếu nhập
  findAll(search?: string): { total: number; data: StockInTransaction[] } {
    let list = this.transactions;
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.transaction_id.toLowerCase().includes(q) ||
          t.reference_number.toLowerCase().includes(q) ||
          (t.supplier_name && t.supplier_name.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q)),
      );
    }
    return {
      total: list.length,
      data: list,
    };
  }

  // Xem chi tiết phiếu nhập (GET /phieu-nhap/:id hoặc GET /transactions/stock-in/:transaction_id)
  findById(id: string): StockInTransaction {
    const found = this.transactions.find(
      (t) => t.transaction_id.toLowerCase() === id.toLowerCase() || t.reference_number.toLowerCase() === id.toLowerCase(),
    );
    if (!found) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_IN_NOT_FOUND',
        error_description: `Không tìm thấy phiếu nhập hàng với mã ${id} trên hệ thống CSDL Dược`,
      });
    }
    return found;
  }

  // Xem trạng thái xử lý của phiếu (GET /transactions/stock-in/:transaction_id/status)
  getStatus(id: string) {
    const item = this.findById(id);
    return {
      transaction_id: item.transaction_id,
      status: item.status,
      is_synced: item.is_synced,
      synced_at: item.synced_at || null,
      national_sync_id: item.national_sync_id || null,
      message:
        item.status === 'completed'
          ? 'Phiếu nhập đã được xử lý và liên thông thành công'
          : 'Dữ liệu đã được hệ thống tiếp nhận để xử lý',
    };
  }

  // Tạo phiếu nhập mới (POST /phieu-nhap hoặc POST /transactions/stock-in)
  create(dto: CreateStockInDto) {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INVALID_DATA',
        error_description: 'Danh sách thuốc trong phiếu nhập (items) không được để trống',
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

    // Tự động xử lý, kiểm tra thuốc trong danh mục và thuốc ngoài danh mục (custom drug)
    let totalAmount = 0;
    const enrichedItems: StockInItem[] = dto.items.map((item, index) => {
      // Hỗ trợ map linh hoạt giữa batch_no và batch_number
      const batchNo = (item.batch_no || item.batch_number || '').trim();
      if (!batchNo) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'INVALID_ITEM',
          error_description: `Mục thứ ${index + 1} thiếu số lô sản xuất (batch_no hoặc batch_number)`,
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
        } else {
          // Nếu không tìm thấy mã trong danh mục nhưng có tên thuốc truyền vào -> coi như thuốc bổ sung
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
        price: itemPrice,
        quantity: itemQty,
        total_price: lineTotal,
        manufacturer,
        is_custom_drug: isCustomDrug,
      };
    });

    const dateStr = transactionDate.slice(0, 10).replace(/-/g, '');
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const transactionId = `PN-${dateStr}-${randCode}`;

    // Tìm tên NCC nếu có
    let supplierName = dto.supplier_name;
    if (!supplierName && dto.supplier_id) {
      const foundSup = mockSuppliers.find((s) => s.id === dto.supplier_id);
      if (foundSup) supplierName = foundSup.name;
    }

    const newTransaction: StockInTransaction = {
      transaction_id: transactionId,
      transaction_date: transactionDate,
      import_date: importDate,
      reason: dto.reason || 'supplier',
      supplier_id: dto.supplier_id,
      supplier_name: supplierName,
      source_store_id: dto.source_store_id,
      source_warehouse_id: dto.source_warehouse_id,
      target_store_id: dto.target_store_id,
      target_warehouse_id: dto.target_warehouse_id,
      reference_number: dto.reference_number || `HD-${dateStr}-${randCode}`,
      invoice_date: dto.invoice_date || importDate,
      practice_license_code: dto.practice_license_code || 'GCN-NT-01294',
      note: dto.note || '',
      status: 'accepted', // Ban đầu là accepted (chưa liên thông)
      is_synced: false,
      items: enrichedItems,
      total_amount: totalAmount,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    this.transactions.unshift(newTransaction);

    return {
      code: 200,
      message: 'Tạo phiếu nhập hàng thành công (Sandbox CSDL Dược)',
      transaction_id: transactionId,
      status: 'accepted',
      data: newTransaction,
    };
  }

  // Sửa phiếu nhập (PUT /phieu-nhap/:id)
  update(id: string, dto: UpdateStockInDto) {
    const itemIndex = this.transactions.findIndex(
      (t) => t.transaction_id.toLowerCase() === id.toLowerCase() || t.reference_number.toLowerCase() === id.toLowerCase(),
    );

    if (itemIndex === -1) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_IN_NOT_FOUND',
        error_description: `Không tìm thấy phiếu nhập với mã ${id} để cập nhật`,
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
    if (dto.reference_number) current.reference_number = dto.reference_number;
    if (dto.invoice_date) current.invoice_date = dto.invoice_date;
    if (dto.practice_license_code) current.practice_license_code = dto.practice_license_code;
    if (dto.note !== undefined) current.note = dto.note;

    current.updated_at = new Date().toISOString();
    this.transactions[itemIndex] = current;

    return {
      code: 200,
      message: 'Cập nhật phiếu nhập thành công',
      data: current,
    };
  }

  // Xóa phiếu nhập (DELETE /phieu-nhap/:id)
  remove(id: string) {
    const itemIndex = this.transactions.findIndex(
      (t) => t.transaction_id.toLowerCase() === id.toLowerCase() || t.reference_number.toLowerCase() === id.toLowerCase(),
    );

    if (itemIndex === -1) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'STOCK_IN_NOT_FOUND',
        error_description: `Không tìm thấy phiếu nhập với mã ${id} để xóa`,
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
    return {
      code: 200,
      message: `Đã xóa thành công phiếu nhập ${removed.transaction_id}`,
      transaction_id: removed.transaction_id,
    };
  }

  // Liên thông phiếu nhập lên CSDL Dược Quốc Gia (POST /phieu-nhap/lien-thong hoặc POST /phieu-nhap/:id/lien-thong)
  sync(idOrDto: string | SyncStockInDto) {
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

    const item = this.findById(id);
    const now = new Date();
    const nationalSyncId = `CSDLD-SYNC-${now.getTime()}-${Math.floor(1000 + Math.random() * 9000)}`;

    item.is_synced = true;
    item.status = 'completed'; // Chuyển sang hoàn tất theo chuẩn 806
    item.synced_at = now.toISOString();
    item.national_sync_id = nationalSyncId;
    item.updated_at = now.toISOString();

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
