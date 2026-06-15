import { describe, expect, it } from 'vitest';
import {
  InvalidReputationIdError,
  parseReputationId,
} from './reputation-id.vo.js';

describe('ReputationId', () => {
  it('should_accept_valid_reputation_id_format', () => {
    expect(parseReputationId('Rep-8F29A')).toBe('Rep-8F29A');
    expect(parseReputationId('018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f')).toBe(
      '018f3b1a-7c2a-7b3c-9d4e-1a2b3c4d5e6f',
    );
  });

  it('should_reject_invalid_reputation_id_format', () => {
    expect(() => parseReputationId('Rep-abc')).toThrow(InvalidReputationIdError);
    expect(() => parseReputationId('not-an-id')).toThrow(InvalidReputationIdError);
    expect(() => parseReputationId('')).toThrow(InvalidReputationIdError);
  });
});
