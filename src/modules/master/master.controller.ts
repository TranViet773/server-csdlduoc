import { Controller, Get, Param, Query } from '@nestjs/common';
import { MasterService } from './master.service';

@Controller()
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  // 1. Lấy danh sách đơn vị tính: GET /unit, GET /master/units, GET /v2/master/units
  @Get(['unit', 'master/units', 'v2/master/units'])
  getUnits(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.masterService.getUnits(page, pageSize);
  }

  // 2. Lấy danh sách thuốc: GET /thuoc, GET /master/drugs, GET /v2/master/drugs
  @Get(['thuoc', 'master/drugs', 'v2/master/drugs'])
  getDrugs(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('registration_number') regNum?: string,
    @Query('sdk') sdk?: string,
  ) {
    return this.masterService.getDrugs(page, pageSize, search || q, regNum || sdk);
  }

  // 3. Lấy chi tiết thuốc: GET /thuoc/:id, GET /master/drugs/:id, GET /v2/master/drugs/:id
  @Get(['thuoc/:id', 'master/drugs/:id', 'v2/master/drugs/:id'])
  getDrugById(@Param('id') id: string) {
    return this.masterService.getDrugById(id);
  }

  // 4. Danh mục nhóm thuốc: GET /nhom-thuoc, GET /master/drug-groups
  @Get(['nhom-thuoc', 'master/drug-groups', 'v2/master/drug-groups'])
  getDrugGroups() {
    return {
      total: this.masterService.getDrugGroups().length,
      data: this.masterService.getDrugGroups(),
    };
  }

  // 5. Danh mục nhà cung cấp: GET /nha-cung-cap, GET /master/suppliers
  @Get(['nha-cung-cap', 'master/suppliers'])
  getSuppliers() {
    return {
      total: this.masterService.getSuppliers().length,
      data: this.masterService.getSuppliers(),
    };
  }
}
