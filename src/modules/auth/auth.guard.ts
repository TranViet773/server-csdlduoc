import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'] || (request.headers['Authorization'] as string);
    const queryToken = (request.query?.token || request.query?.access_token) as string;

    let token = '';

    if (authHeader) {
      const parts = authHeader.trim().split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1].trim();
      } else {
        throw new UnauthorizedException({
          statusCode: 401,
          error: 'INVALID_TOKEN_FORMAT',
          message: 'Định dạng header Authorization phải là "Bearer <token>"',
          error_description: 'Token xác thực không đúng định dạng Bearer theo chuẩn QĐ 806.',
        });
      }
    } else if (queryToken) {
      token = queryToken.trim();
    }

    if (!token) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'UNAUTHORIZED',
        message: 'Yêu cầu access_token trong header Authorization (Mục 5.4 Quyết định 806)',
        error_description: 'Access token hết hạn hoặc không hợp lệ. Vui lòng truyền header "Authorization: Bearer <token>" từ kết quả đăng nhập /auth/login.',
      });
    }

    if (token === 'null' || token === 'undefined' || token.length < 5) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'INVALID_TOKEN',
        message: 'Access token không hợp lệ',
        error_description: 'Token cung cấp rỗng hoặc không hợp lệ.',
      });
    }


    // Gắn thông tin cơ sở / user vào request
    (request as any).user = {
      username: 'nhathuoc_viet',
      facility_name: 'Nhà thuốc Sandbox Test',
      license_code: 'GCN-NT-01294',
      token,
    };

    return true;
  }
}
