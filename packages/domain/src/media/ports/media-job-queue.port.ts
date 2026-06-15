export interface MediaJobQueuePort {
  enqueueAnonymize(mediaId: string, cityId: string): Promise<void>;
}

export const MEDIA_JOB_QUEUE = Symbol('MEDIA_JOB_QUEUE');
