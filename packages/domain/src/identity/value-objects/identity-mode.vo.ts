export const IDENTITY_MODES = ['ghost', 'pseudonym', 'public'] as const;

export type IdentityMode = (typeof IDENTITY_MODES)[number];

export const DEFAULT_IDENTITY_MODE: IdentityMode = 'ghost';

export class InvalidIdentityModeError extends Error {
  constructor(value: string) {
    super(`Invalid identity mode: ${value}`);
    this.name = 'InvalidIdentityModeError';
  }
}

export function parseIdentityMode(value: string): IdentityMode {
  if ((IDENTITY_MODES as readonly string[]).includes(value)) {
    return value as IdentityMode;
  }
  throw new InvalidIdentityModeError(value);
}
