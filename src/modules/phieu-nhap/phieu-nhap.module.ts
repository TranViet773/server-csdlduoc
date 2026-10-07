import { Module } from '@nestjs/common';
import { PhieuNhapController } from './phieu-nhap.controller';
import { PhieuNhapService } from './phieu-nhap.service';

@Module({
  controllers: [PhieuNhapController],
  providers: [PhieuNhapService],
  exports: [PhieuNhapService],
})
export class PhieuNhapModule {}
