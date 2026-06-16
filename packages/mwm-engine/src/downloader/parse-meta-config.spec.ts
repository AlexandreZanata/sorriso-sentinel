import { describe, expect, it } from 'vitest';
import { parseMetaConfig } from './parse-meta-config';

describe('parseMetaConfig', () => {
  it('should_parse_new_format_with_settings', () => {
    const config = parseMetaConfig(
      JSON.stringify({
        servers: ['https://cdn-fi-1.comaps.app/'],
        settings: { donate: 'https://example.com' },
      }),
    );

    expect(config).toEqual({
      servers: ['https://cdn-fi-1.comaps.app/'],
    });
  });

  it('should_parse_legacy_array_format', () => {
    const config = parseMetaConfig(
      JSON.stringify(['https://cdn-us-2.comaps.tech/']),
    );

    expect(config).toEqual({
      servers: ['https://cdn-us-2.comaps.tech/'],
    });
  });

  it('should_return_null_when_servers_missing', () => {
    expect(parseMetaConfig('{}')).toBeNull();
    expect(parseMetaConfig('not-json')).toBeNull();
  });
});
