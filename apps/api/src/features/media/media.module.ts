import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CompleteUploadController } from './complete-upload/complete-upload.controller';
import { CompleteUploadHandler } from './complete-upload/complete-upload.handler';
import { ListOccurrenceMediaController } from './list-occurrence-media/list-occurrence-media.controller';
import { ListOccurrenceMediaHandler } from './list-occurrence-media/list-occurrence-media.handler';
import { RequestUploadSlotController } from './request-upload-slot/request-upload-slot.controller';
import { RequestUploadSlotHandler } from './request-upload-slot/request-upload-slot.handler';

@Module({
  imports: [IdentityModule],
  controllers: [
    RequestUploadSlotController,
    ListOccurrenceMediaController,
    CompleteUploadController,
  ],
  providers: [
    RequestUploadSlotHandler,
    CompleteUploadHandler,
    ListOccurrenceMediaHandler,
  ],
})
export class MediaModule {}
