export interface PresignedPutUrl {
  uploadUrl: string;
  expiresAt: Date;
}

export interface PresignedGetUrl {
  downloadUrl: string;
  expiresAt: Date;
}

export interface ObjectStoragePort {
  presignedPut(
    key: string,
    contentType: string,
    maxContentLength: number,
    expiresInSeconds: number,
  ): Promise<PresignedPutUrl>;
  presignedGet(key: string, expiresInSeconds: number): Promise<PresignedGetUrl>;
  getObject(key: string): Promise<Buffer>;
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
  deleteObject(key: string): Promise<void>;
  ensureBucket(): Promise<void>;
}

export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');
