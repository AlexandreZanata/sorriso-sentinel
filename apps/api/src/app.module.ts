import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { DocsModule } from './features/docs/docs.module';
import { IdentityModule } from './features/identity/identity.module';
import { MediaModule } from './features/media/media.module';
import { OccurrencesModule } from './features/occurrences/occurrences.module';
import { UserAccountsModule } from './features/user-accounts/user-accounts.module';
import { ValidationModule } from './features/validation/validation.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { MediaInfrastructureModule } from './infrastructure/media/media-infrastructure.module';
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    RedisModule.forRoot(),
    MediaInfrastructureModule.forRoot(),
    DocsModule,
    IdentityModule,
    OccurrencesModule,
    MediaModule,
    ValidationModule,
    UserAccountsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
