import { describe, expect, it } from 'vitest';
import { parseCommentText } from './comment-text.vo.js';

describe('CommentText', () => {
  it('should_reject_comment_text_over_1000_chars', () => {
    expect(() => parseCommentText('a'.repeat(1001))).toThrow(
      'Invalid comment text: must be at most 1000 characters',
    );
  });

  it('should_accept_comment_text_up_to_1000_chars', () => {
    const text = 'a'.repeat(1000);
    expect(parseCommentText(text)).toBe(text);
  });

  it('should_reject_empty_comment_text', () => {
    expect(() => parseCommentText('   ')).toThrow(
      'Invalid comment text: must not be empty',
    );
  });
});
