import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PhieuXuatService } from './phieu-xuat.service';
import { CreateStockOutDto, UpdateStockOutDto, SyncStockOutDto } from './phieu-xuat.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller()
@UseGuards(AuthGuard) // Bắt buộc xác thực Bearer Token theo Mục 5.4 QĐ 806
export class PhieuXuatController {
  constructor(private readonly phieuXuatService: PhieuXuatService) {}

  // 1. Lấy danh sách phiếu xuất: GET /phieu-xuat hoặc GET /transactions/stock-out
  @Get(['phieu-xuat', 'transactions/stock-out', 'v2/transactions/stock-out'])
  findAll(
    @Query('search') search?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('is_synced') isSynced?: string,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.phieuXuatService.findAll({
      search,
      q,
      status,
      is_synced: isSynced,
      page,
      page_size: pageSize,
    });
  }

  // 2. Liên thông phiếu xuất lên Cổng CSDL Dược QG (Mục đích đồng bộ): POST /phieu-xuat/lien-thong
  @Post([
    'phieu-xuat/lien-thong',
    'transactions/stock-out/lien-thong',
    'v2/transactions/stock-out/sync',
  ])
  sync(@Body() dto: SyncStockOutDto) {
    return this.phieuXuatService.sync(dto);
  }

  // 2b. Liên thông cụ thể theo ID: POST /phieu-xuat/:id/lien-thong hoặc POST /transactions/stock-out/:id/sync
  @Post(['phieu-xuat/:id/lien-thong', 'transactions/stock-out/:id/sync'])
  syncById(@Param('id') id: string) {
    return this.phieuXuatService.sync(id);
  }

  // 3. Xem trạng thái xử lý phiếu xuất: GET /transactions/stock-out/:id/status (Mục 5.4.6 QĐ 806)
  @Get([
    'transactions/stock-out/:id/status',
    'v2/transactions/stock-out/:id/status',
    'phieu-xuat/:id/status',
  ])
  getStatus(@Param('id') id: string) {
    return this.phieuXuatService.getStatus(id);
  }

  // 4. Xem chi tiết phiếu xuất: GET /transactions/stock-out/:id (Mục 5.4.5 QĐ 806)
  @Get(['phieu-xuat/:id', 'transactions/stock-out/:id', 'v2/transactions/stock-out/:id'])
  findById(@Param('id') id: string) {
    return this.phieuXuatService.findById(id);
  }

  // 5. Tạo mới phiếu xuất: POST /transactions/stock-out (Mục 5.4.4 QĐ 806)
  @Post(['phieu-xuat', 'transactions/stock-out', 'v2/transactions/stock-out'])
  create(@Body() dto: CreateStockOutDto) {
    return this.phieuXuatService.create(dto);
  }

  // 6. Sửa phiếu xuất: PUT /phieu-xuat/:id hoặc PUT /transactions/stock-out/:id
  @Put(['phieu-xuat/:id', 'transactions/stock-out/:id', 'v2/transactions/stock-out/:id'])
  update(@Param('id') id: string, @Body() dto: UpdateStockOutDto) {
    return this.phieuXuatService.update(id, dto);
  }

  // 7. Xóa phiếu xuất: DELETE /phieu-xuat/:id hoặc DELETE /transactions/stock-out/:id
  @Delete(['phieu-xuat/:id', 'transactions/stock-out/:id', 'v2/transactions/stock-out/:id'])
  remove(@Param('id') id: string) {
    return this.phieuXuatService.remove(id);
  }
}
