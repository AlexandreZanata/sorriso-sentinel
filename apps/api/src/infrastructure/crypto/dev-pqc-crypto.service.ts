import { Injectable } from '@nestjs/common';
import type { PqcCryptoPort } from '@sorriso-sentinel/domain';

const DEV_SIGNATURE = new TextEncoder().encode('valid-dev-signature');

@Injectable()
export class DevPqcCryptoService implements PqcCryptoPort {
  async verifyMlDsaSignature(params: {
    message: Uint8Array;
    signature: Uint8Array;
    publicKeyRef: string;
  }): Promise<boolean> {
    if (!/^[a-f0-9]{64}$/i.test(params.publicKeyRef)) {
      return false;
    }

    return Buffer.from(params.signature).equals(Buffer.from(DEV_SIGNATURE));
  }
}
