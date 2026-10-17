import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MasterModule } from './modules/master/master.module';
import { PhieuNhapModule } from './modules/phieu-nhap/phieu-nhap.module';
import { PhieuXuatModule } from './modules/phieu-xuat/phieu-xuat.module';
import { PhieuKiemKhoModule } from './modules/phieu-kiem-kho/phieu-kiem-kho.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [MasterModule, PhieuNhapModule, PhieuXuatModule, PhieuKiemKhoModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

