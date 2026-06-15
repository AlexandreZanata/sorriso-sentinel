import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { ReputationPort, TrustedSourceLabel } from '@sorriso-sentinel/domain';

export const REPUTATION_PORT = Symbol('REPUTATION_PORT');

@Injectable()
export class StubReputationPort implements ReputationPort {
  async getTrustWeight(): Promise<number> {
    return 1;
  }

  async getPublicLabel(): Promise<TrustedSourceLabel> {
    return 'new_source';
  }
}

export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createVerificationToken(): string {
  return randomBytes(24).toString('base64url');
}
