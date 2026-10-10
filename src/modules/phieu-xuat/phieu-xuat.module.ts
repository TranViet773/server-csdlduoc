import { Module } from '@nestjs/common';
import { PhieuXuatController } from './phieu-xuat.controller';
import { PhieuXuatService } from './phieu-xuat.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PhieuXuatController],
  providers: [PhieuXuatService],
  exports: [PhieuXuatService],
})
export class PhieuXuatModule {}
