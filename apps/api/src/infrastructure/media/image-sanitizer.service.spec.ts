import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { ImageSanitizerService } from './image-sanitizer.service.js';

describe('ImageSanitizerService', () => {
  const sanitizer = new ImageSanitizerService();

  it('should_output_jpeg_without_metadata', async () => {
    const input = await sharp({
      create: {
        width: 120,
        height: 120,
        channels: 3,
        background: '#336699',
      },
    })
      .jpeg()
      .toBuffer();

    const result = await sanitizer.sanitize(input);

    expect(result.outputContentType).toBe('image/jpeg');
    expect(result.exifStripped).toBe(true);
    expect(result.width).toBe(120);
    expect(result.height).toBe(120);
  });

  it('should_reject_image_smaller_than_100x100', async () => {
    const input = await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: '#336699',
      },
    })
      .jpeg()
      .toBuffer();

    await expect(sanitizer.sanitize(input)).rejects.toThrow(
      'Image dimensions below minimum allowed',
    );
  });

  it('should_reject_file_with_html_magic_bytes', async () => {
    const input = Buffer.from('<html><body>not an image</body></html>', 'utf8');

    await expect(sanitizer.sanitize(input)).rejects.toThrow(
      'File is not a valid image',
    );
  });
});
