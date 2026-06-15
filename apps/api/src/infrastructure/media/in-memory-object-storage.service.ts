import { Injectable } from '@nestjs/common';
import type {
  ObjectStoragePort,
  PresignedGetUrl,
  PresignedPutUrl,
} from '@sorriso-sentinel/domain';

interface StoredObject {
  body: Buffer;
  contentType: string;
}

@Injectable()
export class InMemoryObjectStorage implements ObjectStoragePort {
  private readonly objects = new Map<string, StoredObject>();

  async ensureBucket(): Promise<void> {
    return undefined;
  }

  async presignedPut(
    key: string,
    contentType: string,
    maxContentLength: number,
    expiresInSeconds: number,
  ): Promise<PresignedPutUrl> {
    return {
      uploadUrl: `memory://upload/${encodeURIComponent(key)}?max=${maxContentLength}&type=${encodeURIComponent(contentType)}`,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async presignedGet(
    key: string,
    expiresInSeconds: number,
  ): Promise<PresignedGetUrl> {
    return {
      downloadUrl: `memory://download/${encodeURIComponent(key)}`,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  async getObject(key: string): Promise<Buffer> {
    const object = this.objects.get(key);

    if (!object) {
      throw new Error(`Object not found: ${key}`);
    }

    return Buffer.from(object.body);
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    this.objects.set(key, { body: Buffer.from(body), contentType });
  }

  async deleteObject(key: string): Promise<void> {
    this.objects.delete(key);
  }

  putObjectDirect(key: string, body: Buffer, contentType: string): void {
    this.objects.set(key, { body: Buffer.from(body), contentType });
  }
}
