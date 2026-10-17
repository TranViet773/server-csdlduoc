import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  login(body: { username?: string; password?: string }) {
    const { username, password } = body;
    if (!username || !password) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INVALID_REQUEST',
        message: 'Thiếu tên đăng nhập hoặc mật khẩu (theo mục 5.1 Quyết định 806)',
        error_description: 'Thiếu tên đăng nhập hoặc mật khẩu (theo mục 5.1 Quyết định 806)',
      });
    }

    let isPasswordMatch = password === 'password123';
    if (!isPasswordMatch) {
      try {
        const decoded = Buffer.from(password, 'base64').toString('utf-8');
        if (decoded === 'password123') {
          isPasswordMatch = true;
        }
      } catch {
        // bỏ qua lỗi decode base64
      }
    }

    if (username !== 'nhathuoc_viet' || !isPasswordMatch) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_CREDENTIALS',
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
        error_description: 'Tên đăng nhập hoặc mật khẩu không chính xác',
      });
    }

    // Trả về response đúng định dạng mục 5.1 Quyết định 806 (chỉ 3 trường: access_token, token_type, expires_in)
    return {
      access_token: `mock_csdlduoc_token_${Buffer.from(username).toString('base64')}_${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 86400, // 24 giờ
    };
  }
}
