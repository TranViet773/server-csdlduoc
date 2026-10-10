import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServerInfo() {
    return {
      name: 'Hệ thống Giả lập Sandbox CSDL Dược Quốc Gia (Quyết định 806 / QĐ 232-QĐ-TTYQG)',
      version: 'v2',
      status: 'online',
      environment: 'sandbox',
      endpoints: {
        authentication: [
          { method: 'POST', path: '/auth/login', desc: 'Đăng nhập lấy access_token (Mục 5.1)' },
          { method: 'POST', path: '/v2/auth/login', desc: 'Chuẩn v2 login' },
        ],
        master_data: [
          { method: 'GET', path: '/unit', desc: 'Danh sách đơn vị tính (Viên, Hộp, Vỉ...)' },
          { method: 'GET', path: '/master/units', desc: 'Chuẩn QĐ 806: Đơn vị tính (Mục 5.2.1)' },
          { method: 'GET', path: '/thuoc', desc: 'Danh sách thuốc (Panadol, Hapacol, Augmentin...)' },
          { method: 'GET', path: '/thuoc/:id', desc: 'Xem chi tiết thông tin thuốc' },
          { method: 'GET', path: '/master/drugs', desc: 'Chuẩn QĐ 806: Danh sách thuốc (Mục 5.3.1)' },
          { method: 'GET', path: '/master/drugs/:id', desc: 'Chuẩn QĐ 806: Chi tiết thuốc (Mục 5.3.2)' },
          { method: 'GET', path: '/nhom-thuoc', desc: 'Danh mục nhóm thuốc' },
          { method: 'GET', path: '/master/drug-groups', desc: 'Chuẩn QĐ 806: Danh mục nhóm thuốc (Mục 5.2.3)' },
          { method: 'GET', path: '/nha-cung-cap', desc: 'Danh mục nhà cung cấp' },
          { method: 'GET', path: '/master/suppliers', desc: 'Danh mục nhà cung cấp chuẩn' },
        ],
        transactions_stock_in: [
          { method: 'GET', path: '/phieu-nhap', desc: 'Danh sách phiếu nhập hàng', auth: false },
          { method: 'GET', path: '/phieu-nhap/:id', desc: 'Chi tiết phiếu nhập hàng', auth: false },
          { method: 'POST', path: '/phieu-nhap', desc: 'Tạo phiếu nhập mới', auth: false },
          { method: 'PUT', path: '/phieu-nhap/:id', desc: 'Cập nhật phiếu nhập', auth: false },
          { method: 'DELETE', path: '/phieu-nhap/:id', desc: 'Xóa phiếu nhập', auth: false },
          { method: 'POST', path: '/phieu-nhap/lien-thong', desc: 'Liên thông phiếu nhập lên CSDL Dược Quốc Gia', auth: false },
          { method: 'GET', path: '/phieu-nhap/:id/status', desc: 'Xem trạng thái xử lý của phiếu nhập', auth: false },
          { method: 'POST', path: '/transactions/stock-in', desc: 'Chuẩn QĐ 806: Tạo phiếu nhập (Mục 5.4.1)', auth: false },
          { method: 'GET', path: '/transactions/stock-in/:id', desc: 'Chuẩn QĐ 806: Chi tiết phiếu nhập (Mục 5.4.2)', auth: false },
          { method: 'GET', path: '/transactions/stock-in/:id/status', desc: 'Chuẩn QĐ 806: Trạng thái phiếu nhập (Mục 5.4.3)', auth: false },
        ],
        transactions_stock_out: [
          { method: 'GET', path: '/phieu-xuat', desc: 'Danh sách phiếu xuất kho (hỗ trợ lọc status, is_synced)', auth: true },
          { method: 'GET', path: '/phieu-xuat/:id', desc: 'Chi tiết phiếu xuất kho', auth: true },
          { method: 'POST', path: '/phieu-xuat', desc: 'Tạo phiếu xuất kho mới (Lưu nháp / Lưu nội bộ)', auth: true },
          { method: 'PUT', path: '/phieu-xuat/:id', desc: 'Cập nhật phiếu xuất (chặn khi đã liên thông)', auth: true },
          { method: 'DELETE', path: '/phieu-xuat/:id', desc: 'Xóa phiếu xuất (chặn khi đã liên thông)', auth: true },
          { method: 'POST', path: '/phieu-xuat/lien-thong', desc: 'Liên thông phiếu xuất lên Cổng CSDL Dược QG', auth: true },
          { method: 'POST', path: '/phieu-xuat/:id/lien-thong', desc: 'Liên thông phiếu xuất theo ID', auth: true },
          { method: 'GET', path: '/phieu-xuat/:id/status', desc: 'Xem trạng thái xử lý phiếu xuất', auth: true },
          { method: 'GET', path: '/transactions/stock-out', desc: 'Chuẩn QĐ 806: Danh sách phiếu xuất kho', auth: true },
          { method: 'POST', path: '/transactions/stock-out', desc: 'Chuẩn QĐ 806: Tạo phiếu xuất hàng (Mục 5.4.4)', auth: true },
          { method: 'GET', path: '/transactions/stock-out/:id', desc: 'Chuẩn QĐ 806: Chi tiết phiếu xuất hàng (Mục 5.4.5)', auth: true },
          { method: 'GET', path: '/transactions/stock-out/:id/status', desc: 'Chuẩn QĐ 806: Trạng thái phiếu xuất (Mục 5.4.6)', auth: true },
          { method: 'POST', path: '/transactions/stock-out/:id/sync', desc: 'Chuẩn QĐ 806: Đồng bộ/liên thông phiếu xuất', auth: true },
        ],
      },
      saved_storage_location: 'ServerCSDL/storage/stock-out-transactions.json',
      saved_storage_location_stock_in: 'ServerCSDL/storage/stock-in-transactions.json',
      storage_files: {
        stock_out_transactions: 'ServerCSDL/storage/stock-out-transactions.json',
        latest_stock_out_request: 'ServerCSDL/storage/latest-stock-out-request.json',
        stock_in_transactions: 'ServerCSDL/storage/stock-in-transactions.json',
        latest_stock_in_request: 'ServerCSDL/storage/latest-stock-in-request.json',
        stock_in_dir: 'ServerCSDL/storage/stock-in/',
      },
      timestamp: new Date().toISOString(),

    };
  }
}
