import { Module } from '@nestjs/common';
import { BcryptPasswordHasher, PASSWORD_HASHER } from '../../infrastructure/auth/bcrypt-password-hasher.service';
import {
  DrizzleRefreshTokenStore,
  InMemoryRefreshTokenStore,
} from '../../infrastructure/auth/drizzle-refresh-token.store';
import {
  ACCESS_TOKEN_ISSUER,
  JwtAccessTokenService,
} from '../../infrastructure/auth/jwt-access-token.service';
import { REFRESH_TOKEN_STORE } from '../../infrastructure/auth/refresh-token.store.port';
import { DATABASE_POOL } from '../../infrastructure/database/database.tokens';
import { RolesGuard } from './guards/roles.guard';
import { TenantGuard } from './guards/tenant.guard';
import { LoginController } from './login/login.controller';
import { LoginHandler } from './login/login.handler';
import { LogoutController } from './logout/logout.controller';
import { LogoutHandler } from './logout/logout.handler';
import { RefreshTokenController } from './refresh-token/refresh-token.controller';
import { RefreshTokenHandler } from './refresh-token/refresh-token.handler';

@Module({
  controllers: [LoginController, RefreshTokenController, LogoutController],
  providers: [
    LoginHandler,
    RefreshTokenHandler,
    LogoutHandler,
    RolesGuard,
    TenantGuard,
    {
      provide: ACCESS_TOKEN_ISSUER,
      useClass: JwtAccessTokenService,
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: REFRESH_TOKEN_STORE,
      useFactory: (pool: import('pg').Pool | null) =>
        pool ? new DrizzleRefreshTokenStore(pool) : new InMemoryRefreshTokenStore(),
      inject: [DATABASE_POOL],
    },
  ],
  exports: [
    ACCESS_TOKEN_ISSUER,
    PASSWORD_HASHER,
    REFRESH_TOKEN_STORE,
    RolesGuard,
    TenantGuard,
  ],
})
export class AuthModule {}
