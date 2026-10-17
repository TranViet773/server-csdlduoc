import { Module } from '@nestjs/common';
import { PhieuKiemKhoController } from './phieu-kiem-kho.controller';
import { PhieuKiemKhoService } from './phieu-kiem-kho.service';

@Module({
  controllers: [PhieuKiemKhoController],
  providers: [PhieuKiemKhoService],
  exports: [PhieuKiemKhoService],
})
export class PhieuKiemKhoModule {}
