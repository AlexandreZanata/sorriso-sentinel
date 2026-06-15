import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { OccurrenceIdGeneratorPort } from './occurrence-id-generator.port';

/**
 * Test double for CI/integration without DATABASE_URL.
 * Production uses PostgresOccurrenceIdGenerator (SELECT uuidv7()).
 */
@Injectable()
export class InMemoryOccurrenceIdGenerator implements OccurrenceIdGeneratorPort {
  async generate(): Promise<string> {
    return generateUuidV7Like();
  }
}

function generateUuidV7Like(date = new Date()): string {
  const unixTsMs = BigInt(date.getTime());
  const rand = randomBytes(10);
  const bytes = new Uint8Array(16);

  bytes[0] = Number((unixTsMs >> 40n) & 0xffn);
  bytes[1] = Number((unixTsMs >> 32n) & 0xffn);
  bytes[2] = Number((unixTsMs >> 24n) & 0xffn);
  bytes[3] = Number((unixTsMs >> 16n) & 0xffn);
  bytes[4] = Number((unixTsMs >> 8n) & 0xffn);
  bytes[5] = Number(unixTsMs & 0xffn);
  bytes[6] = 0x70 | (rand[0]! & 0x0f);
  bytes[7] = rand[1]!;
  bytes[8] = 0x80 | (rand[2]! & 0x3f);
  bytes[9] = rand[3]!;
  bytes[10] = rand[4]!;
  bytes[11] = rand[5]!;
  bytes[12] = rand[6]!;
  bytes[13] = rand[7]!;
  bytes[14] = rand[8]!;
  bytes[15] = rand[9]!;

  const hex = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
