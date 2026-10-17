import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PhieuKiemKhoService } from './phieu-kiem-kho.service';

@Controller()
export class PhieuKiemKhoController {
  constructor(private readonly service: PhieuKiemKhoService) {}

  // 1. Tạo phiếu kiểm kho: POST /transactions/stock-taking (Mục 5.4.7 QĐ 232)
  @Post(['transactions/stock-taking', 'v2/transactions/stock-taking'])
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  // 2. Xem chi tiết phiếu kiểm kho: GET /transactions/stock-taking/:id (Mục 5.4.8 QĐ 232)
  @Get(['transactions/stock-taking/:id', 'v2/transactions/stock-taking/:id'])
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // 3. Xem trạng thái xử lý: GET /transactions/stock-taking/:id/status (Mục 5.4.9 QĐ 232)
  @Get([
    'transactions/stock-taking/:id/status',
    'v2/transactions/stock-taking/:id/status',
  ])
  getStatus(@Param('id') id: string) {
    return this.service.getStatus(id);
  }
}
