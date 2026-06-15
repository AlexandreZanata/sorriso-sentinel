import { Injectable } from '@nestjs/common';
import type { MediaUploadPolicy } from '@sorriso-sentinel/domain';
import { loadMediaUploadPolicyFromEnv } from '@sorriso-sentinel/shared';
import sharp from 'sharp';

export interface SanitizedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  exifStripped: true;
  outputContentType: 'image/jpeg';
}

export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidImageError';
  }
}

@Injectable()
export class ImageSanitizerService {
  private readonly policy: MediaUploadPolicy = loadMediaUploadPolicyFromEnv();

  async sanitize(rawBuffer: Buffer): Promise<SanitizedImageResult> {
    if (this.looksLikeHtml(rawBuffer)) {
      throw new InvalidImageError('File is not a valid image');
    }

    try {
      const image = sharp(rawBuffer, { failOn: 'error' }).rotate();
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new InvalidImageError('Unable to read image dimensions');
      }

      if (
        metadata.width > this.policy.maxDecodedWidth ||
        metadata.height > this.policy.maxDecodedHeight
      ) {
        throw new InvalidImageError('Image dimensions exceed maximum allowed');
      }

      if (
        metadata.width < this.policy.minDecodedWidth ||
        metadata.height < this.policy.minDecodedHeight
      ) {
        throw new InvalidImageError('Image dimensions below minimum allowed');
      }

      const buffer = await image
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      return {
        buffer: buffer.data,
        width: buffer.info.width,
        height: buffer.info.height,
        exifStripped: true,
        outputContentType: 'image/jpeg',
      };
    } catch (error) {
      if (error instanceof InvalidImageError) {
        throw error;
      }

      throw new InvalidImageError('Invalid image file');
    }
  }

  private looksLikeHtml(buffer: Buffer): boolean {
    const prefix = buffer.subarray(0, 16).toString('utf8').toLowerCase();
    return prefix.includes('<html') || prefix.includes('<!doctype');
  }
}
