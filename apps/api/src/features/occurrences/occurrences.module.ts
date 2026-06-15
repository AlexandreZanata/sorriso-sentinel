import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AddCommentController } from './add-comment/add-comment.controller';
import { AddCommentHandler } from './add-comment/add-comment.handler';
import { CreateOccurrenceController } from './create-occurrence/create-occurrence.controller';
import { CreateOccurrenceHandler } from './create-occurrence/create-occurrence.handler';
import { GetOccurrenceController } from './get-occurrence/get-occurrence.controller';
import { GetOccurrenceHandler } from './get-occurrence/get-occurrence.handler';
import { ListOccurrencesController } from './list-occurrences/list-occurrences.controller';
import { ListOccurrencesHandler } from './list-occurrences/list-occurrences.handler';

@Module({
  imports: [IdentityModule],
  controllers: [
    ListOccurrencesController,
    CreateOccurrenceController,
    GetOccurrenceController,
    AddCommentController,
  ],
  providers: [
    CreateOccurrenceHandler,
    ListOccurrencesHandler,
    GetOccurrenceHandler,
    AddCommentHandler,
  ],
})
export class OccurrencesModule {}
