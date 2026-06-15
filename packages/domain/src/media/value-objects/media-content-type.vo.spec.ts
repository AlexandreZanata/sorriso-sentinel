import { describe, expect, it } from 'vitest';
import {
  InvalidMediaContentTypeError,
  parseMediaContentType,
} from './media-content-type.vo.js';

describe('MediaContentType', () => {
  it('should_accept_image_jpeg_content_type', () => {
    expect(parseMediaContentType('image/jpeg')).toBe('image/jpeg');
  });

  it('should_reject_content_type_svg', () => {
    expect(() => parseMediaContentType('image/svg+xml')).toThrow(
      InvalidMediaContentTypeError,
    );
  });
});
