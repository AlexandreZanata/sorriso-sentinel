import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AddCommentController } from './add-comment/add-comment.controller';
import { AddCommentHandler } from './add-comment/add-comment.handler';
import { CreateOccurrenceController } from './create-occurrence/create-occurrence.controller';
import { CreateOccurrenceHandler } from './create-occurrence/create-occurrence.handler';

@Module({
  imports: [IdentityModule],
  controllers: [
    CreateOccurrenceController,
    AddCommentController,
  ],
  providers: [CreateOccurrenceHandler, AddCommentHandler],
})
export class OccurrencesModule {}
