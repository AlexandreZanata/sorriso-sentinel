import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      session?: SessionClaims;
    }>();

    const tenantHeaderName =
      process.env.TENANT_HEADER?.toLowerCase() ?? 'x-city-id';
    const tenantHeader = request.headers[tenantHeaderName];
    const headerValue = Array.isArray(tenantHeader)
      ? tenantHeader[0]
      : tenantHeader;

    if (!headerValue || !request.session) {
      return true;
    }

    if (headerValue !== request.session.cityId) {
      throw new ForbiddenException({ code: 'CITY_MISMATCH' });
    }

    return true;
  }
}
