import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { InMemoryOccurrenceStore, OCCURRENCE_STORE } from '../../infrastructure/occurrences/in-memory-occurrence.store';
import { CreateOccurrenceController } from './create-occurrence/create-occurrence.controller';
import { CreateOccurrenceHandler } from './create-occurrence/create-occurrence.handler';

@Module({
  imports: [IdentityModule],
  controllers: [CreateOccurrenceController],
  providers: [
    CreateOccurrenceHandler,
    {
      provide: OCCURRENCE_STORE,
      useClass: InMemoryOccurrenceStore,
    },
  ],
})
export class OccurrencesModule {}
