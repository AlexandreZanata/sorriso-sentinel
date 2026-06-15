import { createHmac, timingSafeEqual } from 'node:crypto';

export function createRotationProof(params: {
  contributorId: string;
  currentLocalKeyRef: string;
  newLocalKeyRef: string;
  secret: string;
}): string {
  return createHmac('sha256', params.secret)
    .update(
      `${params.contributorId}:${params.currentLocalKeyRef}:${params.newLocalKeyRef}`,
    )
    .digest('hex');
}

export function verifyRotationProof(params: {
  contributorId: string;
  currentLocalKeyRef: string;
  newLocalKeyRef: string;
  rotationProof: string;
  secret: string;
}): boolean {
  const expected = createRotationProof(params);
  const expectedBuffer = Buffer.from(expected);
  const proofBuffer = Buffer.from(params.rotationProof);

  if (expectedBuffer.length !== proofBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, proofBuffer);
}
