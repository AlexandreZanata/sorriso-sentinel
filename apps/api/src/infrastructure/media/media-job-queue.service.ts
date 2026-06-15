import { Inject, Injectable } from '@nestjs/common';
import { MEDIA_JOB_QUEUE, type MediaJobQueuePort } from '@sorriso-sentinel/domain';
import { AnonymizeMediaService } from './anonymize-media.service';

@Injectable()
export class InlineMediaJobQueue implements MediaJobQueuePort {
  constructor(private readonly anonymizeMedia: AnonymizeMediaService) {}

  async enqueueAnonymize(mediaId: string, cityId: string): Promise<void> {
    await this.anonymizeMedia.process(mediaId, cityId);
  }
}

@Injectable()
export class BullMqMediaJobQueue implements MediaJobQueuePort {
  constructor(
    @Inject('BULLMQ_QUEUE')
    private readonly queue: {
      add: (
        name: string,
        data: { mediaId: string; cityId: string },
      ) => Promise<void>;
    } | null,
    private readonly inlineQueue: InlineMediaJobQueue,
  ) {}

  async enqueueAnonymize(mediaId: string, cityId: string): Promise<void> {
    if (!this.queue) {
      await this.inlineQueue.enqueueAnonymize(mediaId, cityId);
      return;
    }

    await this.queue.add('anonymize', { mediaId, cityId });
  }
}
