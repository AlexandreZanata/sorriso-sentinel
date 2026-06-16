import * as Crypto from 'expo-crypto';
import { bootstrapSessionSchema } from '@sorriso-sentinel/shared';
import {
  getOrCreateLocalKeyRef,
  setSessionToken,
} from '../../api/auth-storage';
import { getDefaultCityId } from '../../api/config';
import { bootstrapSession } from '../../api/routes/sessions';

function createLocalKeyRef(): string {
  return `mobile-${Crypto.randomUUID()}`;
}

export async function runSessionBootstrap(): Promise<string> {
  const cityId = getDefaultCityId();
  const localKeyRef = await getOrCreateLocalKeyRef(createLocalKeyRef);
  const body = bootstrapSessionSchema.parse({ cityId, localKeyRef });
  const response = await bootstrapSession(body);

  await setSessionToken(response.sessionToken);

  return response.sessionToken;
}
