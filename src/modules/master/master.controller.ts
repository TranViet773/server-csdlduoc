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

  // 4. Danh mục nhóm thuốc: GET /master/drug-groups, GET /v2/master/drug-groups (Mục 5.2.3 QĐ 232)
  @Get(['nhom-thuoc', 'master/drug-groups', 'v2/master/drug-groups'])
  getDrugGroups(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.masterService.getDrugGroups(page, pageSize);
  }

  // 5. Danh mục quốc gia: GET /master/countries, GET /v2/master/countries (Mục 5.2.2 QĐ 232)
  @Get(['master/countries', 'v2/master/countries'])
  getCountries(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.masterService.getCountries(page, pageSize);
  }

  // 6. Danh mục đường dùng: GET /master/routes, GET /v2/master/routes (Mục 5.2.4 QĐ 232)
  @Get(['master/routes', 'v2/master/routes'])
  getRoutes(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.masterService.getRoutes(page, pageSize);
  }

  // 7. Danh mục nhà sản xuất: GET /master/manufacturers, GET /v2/master/manufacturers (Mục 5.2.5 QĐ 232)
  @Get(['master/manufacturers', 'v2/master/manufacturers'])
  getManufacturers(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.masterService.getManufacturers(page, pageSize);
  }

  // 8. Danh mục tỉnh/thành phố: GET /master/provinces, GET /v2/master/provinces (Mục 5.2.6 QĐ 232)
  @Get(['master/provinces', 'v2/master/provinces'])
  getProvinces(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.masterService.getProvinces(page, pageSize);
  }

  // 9. Danh mục xã/phường: GET /master/communes, GET /v2/master/communes (Mục 5.2.7 QĐ 232)
  @Get(['master/communes', 'v2/master/communes'])
  getCommunes(
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
    @Query('province_id') provinceId?: string,
  ) {
    return this.masterService.getCommunes(page, pageSize, provinceId);
  }

  // 10. Danh mục nhà cung cấp: GET /nha-cung-cap, GET /master/suppliers, GET /v2/master/suppliers
  @Get(['nha-cung-cap', 'master/suppliers', 'v2/master/suppliers'])
  getSuppliers() {
    return {
      total: this.masterService.getSuppliers().length,
      data: this.masterService.getSuppliers(),
    };
  }
}
