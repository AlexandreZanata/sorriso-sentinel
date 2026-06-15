export const DEFAULT_MAX_VALIDATION_VOTES_PER_HOUR = 30;
export const DEFAULT_VALIDATION_RATE_LIMIT_WINDOW_SECONDS = 3600;

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

export function loadValidationRateLimitFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): { limit: number; windowSeconds: number } {
  return {
    limit: parsePositiveInt(
      env.MAX_VALIDATION_VOTES_PER_HOUR,
      DEFAULT_MAX_VALIDATION_VOTES_PER_HOUR,
    ),
    windowSeconds: parsePositiveInt(
      env.VALIDATION_RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_VALIDATION_RATE_LIMIT_WINDOW_SECONDS,
    ),
  };
}
