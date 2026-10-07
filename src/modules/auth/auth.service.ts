import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(body: { username?: string; password?: string }) {
    const { username, password } = body;
    if (!username || !password) {
      throw new BadRequestException({
        error: 'INVALID_CREDENTIALS',
        error_description: 'Thiếu tên đăng nhập hoặc mật khẩu (theo mục 5.1 Quyết định 806)',
      });
    }

    // Trả về response đúng định dạng mục 5.1 Quyết định 806
    return {
      access_token: `mock_csdlduoc_token_${Buffer.from(username).toString('base64')}_${Date.now()}`,
      token_type: 'Bearer',
      expires_in: 86400, // 24 giờ
      facility: {
        username,
        facility_name: 'Nhà thuốc Sandbox Test',
        license_code: 'GCN-NT-01294',
        environment: 'sandbox',
      },
    };
  }
}
