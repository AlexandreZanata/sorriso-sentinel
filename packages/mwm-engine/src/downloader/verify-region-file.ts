import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

function digestToBase64(digest: ArrayBuffer): string {
  const bytes = new Uint8Array(digest);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  if (typeof btoa === 'function') {
    return btoa(binary);
  }

  return Buffer.from(bytes).toString('base64');
}

export async function computeFileSha1Base64(filePath: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = base64ToUint8Array(base64);
    const digest = await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA1,
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    );

    return digestToBase64(digest);
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
