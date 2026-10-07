import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo() {
    return this.appService.getServerInfo();
  }

  @Get('hello')
  getHello() {
    return {
      message: 'Hello World! Sandbox CSDL Dược Quốc Gia sẵn sàng phục vụ.',
      timestamp: new Date().toISOString(),
    };
  }
}
