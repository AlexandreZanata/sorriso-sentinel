import { describe, expect, it } from 'vitest';
import { getApiUrlCandidates } from './resolve-api-base-url';

describe('getApiUrlCandidates', () => {
  it('should_include_usb_and_emulator_fallbacks', () => {
    const candidates = getApiUrlCandidates();

    expect(candidates[0]).toBe('http://127.0.0.1:3010');
    expect(candidates).toContain('http://10.0.2.2:3010');
    expect(candidates.length).toBeGreaterThanOrEqual(2);
  });
});
