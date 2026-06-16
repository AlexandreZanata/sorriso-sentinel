import type { BootstrapSessionInput } from '@sorriso-sentinel/shared';
import { apiRequest } from '../client';

export interface BootstrapSessionResponse {
  sessionToken: string;
  reputationId: string;
  contributorId: string;
  identityMode: 'ghost';
}

export async function bootstrapSession(
  body: BootstrapSessionInput,
): Promise<BootstrapSessionResponse> {
  return apiRequest<BootstrapSessionResponse>('/sessions/bootstrap', {
    method: 'POST',
    body,
    auth: 'none',
    cityId: body.cityId,
  });
}
