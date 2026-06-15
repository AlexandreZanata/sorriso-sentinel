export interface PqcCryptoPort {
  verifyMlDsaSignature(params: {
    message: Uint8Array;
    signature: Uint8Array;
    publicKeyRef: string;
  }): Promise<boolean>;
}

export const PQC_CRYPTO_PORT = Symbol('PQC_CRYPTO_PORT');

export interface DeviceRegistrationProof {
  contributorId: string;
  cityId: string;
  deviceNonce: string;
  signature: Uint8Array;
  publicKeyRef: string;
}

export function buildDeviceRegistrationMessage(params: {
  contributorId: string;
  cityId: string;
  deviceNonce: string;
}): Uint8Array {
  const payload = `${params.contributorId}:${params.cityId}:${params.deviceNonce}`;
  return new TextEncoder().encode(payload);
}
