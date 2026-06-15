import { describe, expect, it } from 'vitest';
import { InvalidPasswordError, parsePassword } from './password.vo.js';

describe('parsePassword', () => {
  it('should_accept_password_with_minimum_length', () => {
    expect(parsePassword('valid-password')).toBe('valid-password');
  });

  it('should_reject_password_shorter_than_12_characters', () => {
    expect(() => parsePassword('short')).toThrow(InvalidPasswordError);
  });
});
