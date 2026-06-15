export const AUTH_ROLES = [
  'city_admin',
  'moderator',
  'security_audit',
  'lgpd_officer',
] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

export const DEFAULT_ACCESS_TOKEN_TTL_SECONDS = 900;
export const DEFAULT_REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const DEFAULT_BCRYPT_COST = 12;

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function loadAuthConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): {
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  bcryptCost: number;
  jwtIssuer: string;
  jwtAudience: string;
  jwtSecret: string;
} {
  return {
    accessTokenTtlSeconds: parsePositiveInt(
      env.ACCESS_TOKEN_TTL_SECONDS,
      DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
    ),
    refreshTokenTtlSeconds: parsePositiveInt(
      env.REFRESH_TOKEN_TTL_SECONDS,
      DEFAULT_REFRESH_TOKEN_TTL_SECONDS,
    ),
    bcryptCost: parsePositiveInt(env.BCRYPT_COST, DEFAULT_BCRYPT_COST),
    jwtIssuer: env.JWT_ISSUER ?? 'sorriso-sentinel',
    jwtAudience: env.JWT_AUDIENCE ?? 'sorriso-sentinel-api',
    jwtSecret:
      env.JWT_ACCESS_SECRET ??
      env.SESSION_TOKEN_SECRET ??
      'dev-jwt-secret-change-me',
  };
}
