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
          { method: 'GET', path: '/nha-cung-cap', desc: 'Danh mục nhà cung cấp' },
        ],
        transactions: [
          { method: 'GET', path: '/phieu-nhap', desc: 'Danh sách phiếu nhập hàng' },
          { method: 'GET', path: '/phieu-nhap/:id', desc: 'Chi tiết phiếu nhập hàng' },
          { method: 'POST', path: '/phieu-nhap', desc: 'Tạo phiếu nhập mới' },
          { method: 'PUT', path: '/phieu-nhap/:id', desc: 'Cập nhật phiếu nhập' },
          { method: 'DELETE', path: '/phieu-nhap/:id', desc: 'Xóa phiếu nhập' },
          { method: 'POST', path: '/phieu-nhap/lien-thong', desc: 'Liên thông phiếu nhập lên CSDL Dược Quốc Gia' },
          { method: 'GET', path: '/phieu-nhap/:id/status', desc: 'Xem trạng thái xử lý của phiếu nhập' },
          { method: 'POST', path: '/transactions/stock-in', desc: 'Chuẩn QĐ 806: Tạo phiếu nhập (Mục 5.4.1)' },
          { method: 'GET', path: '/transactions/stock-in/:id', desc: 'Chuẩn QĐ 806: Chi tiết phiếu nhập (Mục 5.4.2)' },
          { method: 'GET', path: '/transactions/stock-in/:id/status', desc: 'Chuẩn QĐ 806: Trạng thái phiếu nhập (Mục 5.4.3)' },
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }
}
