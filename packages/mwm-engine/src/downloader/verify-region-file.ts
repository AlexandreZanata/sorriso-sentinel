import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import { Sha1Hasher } from './sha1-hasher';

const CHUNK_SIZE_BYTES = 1024 * 1024;

export async function computeFileSha1Base64(filePath: string): Promise<string | null> {
  try {
    const file = new File(filePath);

    if (!file.exists) {
      return null;
    }

    const handle = file.open();
    const hasher = new Sha1Hasher();

    try {
      while (true) {
        const chunk = handle.readBytes(CHUNK_SIZE_BYTES);

        if (chunk.length === 0) {
          break;
        }

        hasher.update(chunk);
      }
    } finally {
      handle.close();
    }

    return hasher.digestBase64();
  } catch {
    return null;
  }
}

export async function verifyRegionFile(
  filePath: string,
  expectedSizeBytes: number,
  expectedSha1Base64: string,
): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(filePath);

  if (!info.exists || typeof info.size !== 'number' || info.size !== expectedSizeBytes) {
    return false;
  }

  const digest = await computeFileSha1Base64(filePath);

  return digest === expectedSha1Base64;
}
