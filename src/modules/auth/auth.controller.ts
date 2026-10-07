import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/login hoặc POST /v2/auth/login
  @Post(['auth/login', 'v2/auth/login'])
  login(@Body() body: { username?: string; password?: string }) {
    return this.authService.login(body);
  }
}
