import { parseCorsOrigins } from './cors-config';

const DEV_JWT_SECRET = 'dev-jwt-secret-change-me';
const DEV_SESSION_SECRET = 'dev-session-secret-change-me';

function resolveJwtSecret(env: NodeJS.ProcessEnv): string | undefined {
  return env.JWT_ACCESS_SECRET?.trim() || env.SESSION_TOKEN_SECRET?.trim();
}

export function assertProductionEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  parseCorsOrigins({
    nodeEnv: env.NODE_ENV,
    corsOrigins: env.CORS_ORIGINS,
  });

  const jwtSecret = resolveJwtSecret(env);

  if (
    !jwtSecret ||
    jwtSecret === DEV_JWT_SECRET ||
    jwtSecret === DEV_SESSION_SECRET
  ) {
    throw new Error(
      'JWT_ACCESS_SECRET must be set to a non-default value in production',
    );
  }
}
