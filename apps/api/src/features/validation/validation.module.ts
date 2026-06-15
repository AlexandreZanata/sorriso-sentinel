import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CastValidationVoteHandler } from './cast-validation-vote/cast-validation-vote.handler';
import { ConfirmOccurrenceController } from './confirm-occurrence/confirm-occurrence.controller';
import { DenyOccurrenceController } from './deny-occurrence/deny-occurrence.controller';

@Module({
  imports: [IdentityModule],
  controllers: [ConfirmOccurrenceController, DenyOccurrenceController],
  providers: [CastValidationVoteHandler],
})
export class ValidationModule {}
