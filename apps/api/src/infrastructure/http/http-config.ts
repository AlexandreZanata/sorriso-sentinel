import type { INestApplication } from '@nestjs/common';
import { assertProductionEnvironment } from './production-env.guard';
import { enableApplicationCors } from './cors-config';
import { applySecurityHeaders } from './security-headers';

export function configureHttp(app: INestApplication): void {
  assertProductionEnvironment();
  applySecurityHeaders(app);
  enableApplicationCors(app);
}
