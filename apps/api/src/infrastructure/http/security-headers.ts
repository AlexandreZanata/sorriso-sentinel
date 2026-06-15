import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';
import type { INestApplication } from '@nestjs/common';

export interface SecurityHeaderOptions {
  nodeEnv?: string;
  trustProxy?: boolean;
}

function isTruthy(value: string | undefined): boolean {
  return value === '1' || value?.toLowerCase() === 'true';
}

export function buildHelmetOptions(
  options: SecurityHeaderOptions = {},
): HelmetOptions {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const trustProxy =
    options.trustProxy ?? isTruthy(process.env.TRUST_PROXY);

  return {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts:
      nodeEnv === 'production' && trustProxy
        ? {
            maxAge: 31_536_000,
            includeSubDomains: true,
            preload: false,
          }
        : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'deny' },
  };
}

export function applySecurityHeaders(
  app: INestApplication,
  options: SecurityHeaderOptions = {},
): void {
  app.use(helmet(buildHelmetOptions(options)));
}
