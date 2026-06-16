export interface CorsConfigOptions {
  nodeEnv?: string;
  corsOrigins?: string;
}

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8082',
] as const;

function isProduction(nodeEnv: string | undefined): boolean {
  return nodeEnv === 'production';
}

export function parseCorsOrigins(options: CorsConfigOptions = {}): string[] {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const configured = (options.corsOrigins ?? process.env.CORS_ORIGINS)?.trim();

  if (!configured) {
    if (isProduction(nodeEnv)) {
      throw new Error('CORS_ORIGINS is required when NODE_ENV=production');
    }

    return [...DEFAULT_DEV_ORIGINS];
  }

  const origins = configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction(nodeEnv) && origins.some((origin) => origin === '*')) {
    throw new Error('Wildcard CORS origin is forbidden in production');
  }

  return origins;
}

export function enableApplicationCors(
  app: { enableCors: (options: object) => void },
  options: CorsConfigOptions = {},
): void {
  app.enableCors({
    origin: parseCorsOrigins(options),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'x-city-id',
      'x-correlation-id',
    ],
    credentials: true,
    maxAge: 3600,
  });
}
