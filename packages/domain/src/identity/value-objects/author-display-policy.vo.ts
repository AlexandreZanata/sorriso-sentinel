export const AUTHOR_DISPLAY_POLICIES = [
  'ghost',
  'pseudonym',
  'public',
  'forced_ghost',
] as const;

export type AuthorDisplayPolicy = (typeof AUTHOR_DISPLAY_POLICIES)[number];

export class InvalidAuthorDisplayPolicyError extends Error {
  constructor(value: string) {
    super(`Invalid author display policy: ${value}`);
    this.name = 'InvalidAuthorDisplayPolicyError';
  }
}

export function parseAuthorDisplayPolicy(value: string): AuthorDisplayPolicy {
  if ((AUTHOR_DISPLAY_POLICIES as readonly string[]).includes(value)) {
    return value as AuthorDisplayPolicy;
  }
  throw new InvalidAuthorDisplayPolicyError(value);
}

export function isForcedGhostDisplay(policy: AuthorDisplayPolicy): boolean {
  return policy === 'forced_ghost' || policy === 'ghost';
}
