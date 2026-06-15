import { describe, expect, it } from 'vitest';
import { buildHelmetOptions } from './security-headers';

describe('buildHelmetOptions', () => {
  it('should_disable_hsts_outside_production', () => {
    const options = buildHelmetOptions({ nodeEnv: 'development' });

    expect(options.hsts).toBe(false);
  });

  it('should_enable_hsts_when_production_and_trust_proxy', () => {
    const options = buildHelmetOptions({
      nodeEnv: 'production',
      trustProxy: true,
    });

    expect(options.hsts).toMatchObject({
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: false,
    });
  });
});
