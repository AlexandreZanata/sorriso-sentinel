import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { logoutSchema } from '@sorriso-sentinel/shared';
import { hashRefreshToken } from '../../../infrastructure/auth/jwt-access-token.service';
import {
  REFRESH_TOKEN_STORE,
  type RefreshTokenStorePort,
} from '../../../infrastructure/auth/refresh-token.store.port';

@Injectable()
export class LogoutHandler {
  constructor(
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshTokens: RefreshTokenStorePort,
  ) {}

  async execute(body: unknown): Promise<{ revoked: true }> {
    const parsed = logoutSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    const stored = await this.refreshTokens.findByTokenHash(
      hashRefreshToken(parsed.data.refreshToken),
    );

    if (!stored) {
      throw new UnauthorizedException({ code: 'INVALID_REFRESH_TOKEN' });
    }

    await this.refreshTokens.revokeFamily(stored.familyId, new Date());

    return { revoked: true };
  }
}
