import { createHmac } from 'node:crypto';

export function buildDeviceBindingDigest(params: {
  cityId: string;
  contributorId: string;
  deviceNonce: string;
  secret: string;
}): string {
  return createHmac('sha256', params.secret)
    .update(`${params.cityId}:${params.contributorId}:${params.deviceNonce}`)
    .digest('hex');
}

export function decodePqcSignature(value: string): Uint8Array {
  if (/^[a-f0-9]+$/i.test(value) && value.length % 2 === 0) {
    return Uint8Array.from(Buffer.from(value, 'hex'));
  }

  return Uint8Array.from(Buffer.from(value, 'base64url'));
}
