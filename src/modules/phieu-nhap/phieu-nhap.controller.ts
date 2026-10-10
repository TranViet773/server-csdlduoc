import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { PhieuNhapService } from './phieu-nhap.service';
import { CreateStockInDto, UpdateStockInDto, SyncStockInDto } from './phieu-nhap.dto';

@Controller()
export class PhieuNhapController {
  constructor(private readonly phieuNhapService: PhieuNhapService) {}

  // 1. Lấy danh sách phiếu nhập: GET /phieu-nhap hoặc GET /transactions/stock-in
  @Get(['phieu-nhap', 'transactions/stock-in', 'v2/transactions/stock-in'])
  findAll(
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('is_synced') isSynced?: string,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.phieuNhapService.findAll({
      search,
      q,
      status,
      is_synced: isSynced,
      page,
      page_size: pageSize,
    });
  }

  // 2. Liên thông phiếu nhập: POST /phieu-nhap/lien-thong
  @Post(['phieu-nhap/lien-thong', 'transactions/stock-in/lien-thong', 'v2/transactions/stock-in/sync'])
  sync(@Body() dto: SyncStockInDto) {
    return this.phieuNhapService.sync(dto);
  }

  // 2b. Liên thông cụ thể theo ID: POST /phieu-nhap/:id/lien-thong
  @Post(['phieu-nhap/:id/lien-thong', 'transactions/stock-in/:id/sync'])
  syncById(@Param('id') id: string, @Body() body?: any) {
    return this.phieuNhapService.sync(id, body);
  }

  // 3. Xem trạng thái xử lý: GET /transactions/stock-in/:id/status hoặc GET /phieu-nhap/:id/status
  @Get([
    'transactions/stock-in/:id/status',
    'v2/transactions/stock-in/:id/status',
    'phieu-nhap/:id/status',
  ])
  getStatus(@Param('id') id: string) {
    return this.phieuNhapService.getStatus(id);
  }

  // 4. Xem chi tiết phiếu nhập: GET /phieu-nhap/:id hoặc GET /transactions/stock-in/:id
  @Get(['phieu-nhap/:id', 'transactions/stock-in/:id', 'v2/transactions/stock-in/:id'])
  findById(@Param('id') id: string) {
    return this.phieuNhapService.findById(id);
  }

  // 5. Tạo mới phiếu nhập: POST /phieu-nhap hoặc POST /transactions/stock-in
  @Post(['phieu-nhap', 'transactions/stock-in', 'v2/transactions/stock-in'])
  create(@Body() dto: CreateStockInDto) {
    return this.phieuNhapService.create(dto);
  }

  // 6. Sửa phiếu nhập: PUT /phieu-nhap/:id hoặc PUT /transactions/stock-in/:id
  @Put(['phieu-nhap/:id', 'transactions/stock-in/:id', 'v2/transactions/stock-in/:id'])
  update(@Param('id') id: string, @Body() dto: UpdateStockInDto) {
    return this.phieuNhapService.update(id, dto);
  }

  // 7. Xóa phiếu nhập: DELETE /phieu-nhap/:id hoặc DELETE /transactions/stock-in/:id
  @Delete(['phieu-nhap/:id', 'transactions/stock-in/:id', 'v2/transactions/stock-in/:id'])
  remove(@Param('id') id: string) {
    return this.phieuNhapService.remove(id);
  }
}
