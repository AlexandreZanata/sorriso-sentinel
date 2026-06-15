import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { IdentityModule } from './features/identity/identity.module';
import { OccurrencesModule } from './features/occurrences/occurrences.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';

@Module({
  imports: [
    DatabaseModule.forRoot(),
    RedisModule.forRoot(),
    IdentityModule,
    OccurrencesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
