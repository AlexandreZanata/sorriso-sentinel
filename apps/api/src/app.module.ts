import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { IdentityModule } from './features/identity/identity.module';
import { OccurrencesModule } from './features/occurrences/occurrences.module';

@Module({
  imports: [IdentityModule, OccurrencesModule],
  controllers: [HealthController],
})
export class AppModule {}
