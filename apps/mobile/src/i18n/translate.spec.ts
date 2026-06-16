import { describe, expect, it } from 'vitest';
import { translate } from './translate';

describe('translate', () => {
  it('should_return_english_message_for_en_locale', () => {
    expect(translate('en', 'app.name')).toBe('Sorriso Sentinel');
  });

  it('should_return_portuguese_message_for_pt_br_locale', () => {
    expect(translate('pt-BR', 'app.name')).toBe('Sorriso Sentinel');
    expect(translate('pt-BR', 'tabs.map')).toBe('Mapa');
  });

  it('should_fall_back_to_english_when_key_missing_in_locale', () => {
    expect(translate('pt-BR', 'nonexistent.key.xyz')).toBe('nonexistent.key.xyz');
    expect(translate('en', 'tabs.map')).toBe('Map');
  });

  it('should_interpolate_params', () => {
    expect(translate('en', 'validation.votesRemaining', { count: 12 })).toBe(
      '12 votes remaining this hour',
    );
  });
});
