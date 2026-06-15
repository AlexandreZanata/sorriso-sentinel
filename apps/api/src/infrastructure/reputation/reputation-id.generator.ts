import { randomBytes } from 'node:crypto';

const REPUTATION_SUFFIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateReputationId(): string {
  const bytes = randomBytes(5);
  let suffix = '';

  for (let i = 0; i < 5; i += 1) {
    const byte = bytes[i] ?? 0;
    suffix += REPUTATION_SUFFIX_CHARS[byte % REPUTATION_SUFFIX_CHARS.length];
  }

  return `Rep-${suffix}`;
}
