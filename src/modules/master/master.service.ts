import { Injectable, NotFoundException } from '@nestjs/common';
import { mockUnits, mockDrugs, mockDrugGroups, mockSuppliers } from '../../data/mockData';
import { MasterUnit, MasterDrug, MasterDrugGroup, Supplier } from '../../data/types';

@Injectable()
export class MasterService {
  // Lấy danh sách đơn vị tính theo chuẩn Decision 806 (GET /master/units hoặc /unit)
  getUnits(page: number = 1, pageSize: number = 20): { page: number; total: number; data: MasterUnit[] } {
    const p = Math.max(1, Number(page) || 1);
    const size = Math.min(50, Math.max(1, Number(pageSize) || 20));
    const start = (p - 1) * size;
    const paginated = mockUnits.slice(start, start + size);

    return {
      page: p,
      total: mockUnits.length,
      data: paginated,
    };
  }

  // Lấy danh sách thuốc theo chuẩn Decision 806 (GET /master/drugs hoặc /thuoc)
  getDrugs(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    registrationNumber?: string,
  ): { page: number; total: number; data: MasterDrug[] } {
    const p = Math.max(1, Number(page) || 1);
    const size = Math.min(50, Math.max(1, Number(pageSize) || 20));

    let filtered = mockDrugs;

    // Lọc chính xác theo Số đăng ký nếu có
    if (registrationNumber && registrationNumber.trim()) {
      const reg = registrationNumber.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.registration_number.toLowerCase().includes(reg) ||
          d.id.toLowerCase().includes(reg),
      );
    }

    // Lọc theo từ khóa tìm kiếm đa năng
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.registration_number.toLowerCase().includes(q) ||
          d.active_pharmaceutical_ingredient.toLowerCase().includes(q),
      );
    }

    const start = (p - 1) * size;
    const paginated = filtered.slice(start, start + size);

    return {
      page: p,
      total: filtered.length,
      data: paginated,
    };
  }

  // Lấy thông tin chi tiết một thuốc (GET /master/drugs/:drug_id hoặc /thuoc/:id)
  getDrugById(drugId: string): MasterDrug {
    const drug = mockDrugs.find(
      (d) => d.id.toLowerCase() === drugId.toLowerCase() || d.registration_number.toLowerCase() === drugId.toLowerCase(),
    );
    if (!drug) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'DRUG_NOT_FOUND',
        error_description: `Không tìm thấy thuốc với mã định danh hoặc số đăng ký ${drugId} trong CSDL Dược Quốc Gia`,
      });
    }
    return drug;
  }

  // Lấy danh mục nhóm thuốc
  getDrugGroups(): MasterDrugGroup[] {
    return mockDrugGroups;
  }

  // Lấy danh mục nhà cung cấp
  getSuppliers(): Supplier[] {
    return mockSuppliers;
  }
}
