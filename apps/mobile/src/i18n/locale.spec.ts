import { describe, expect, it } from 'vitest';
import { parseStoredLocale, resolveAppLocale, resolveDeviceLocale } from './locale';

describe('resolveDeviceLocale', () => {
  it('should_map_portuguese_tags_to_pt_br', () => {
    expect(resolveDeviceLocale('pt-BR')).toBe('pt-BR');
    expect(resolveDeviceLocale('pt')).toBe('pt-BR');
  });

  it('should_default_to_en_for_other_tags', () => {
    expect(resolveDeviceLocale('en-US')).toBe('en');
    expect(resolveDeviceLocale(undefined)).toBe('en');
  });
});

describe('resolveAppLocale', () => {
  it('should_prefer_stored_locale_over_device', () => {
    expect(resolveAppLocale('en', 'pt-BR')).toBe('en');
  });

  it('should_fall_back_to_device_when_stored_invalid', () => {
    expect(resolveAppLocale('fr', 'pt-PT')).toBe('pt-BR');
  });
});

describe('parseStoredLocale', () => {
  it('should_return_null_for_unknown_values', () => {
    expect(parseStoredLocale('fr')).toBeNull();
  });
});
