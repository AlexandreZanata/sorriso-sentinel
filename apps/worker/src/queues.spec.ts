import { describe, expect, it } from 'vitest';
import { QUEUE_NAMES } from './queues.js';

describe('QUEUE_NAMES', () => {
  it('should_define_media_anonymize_queue', () => {
    expect(QUEUE_NAMES.MEDIA_ANONYMIZE).toBe('media-anonymize');
  });
});
