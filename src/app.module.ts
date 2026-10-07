import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MasterModule } from './modules/master/master.module';
import { PhieuNhapModule } from './modules/phieu-nhap/phieu-nhap.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [MasterModule, PhieuNhapModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
