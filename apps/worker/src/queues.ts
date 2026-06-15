export const QUEUE_NAMES = {
  MEDIA_ANONYMIZE: 'media-anonymize',
  COMPUTE_TRENDS: 'compute-trends',
  GENERATE_MISSIONS: 'generate-missions',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
