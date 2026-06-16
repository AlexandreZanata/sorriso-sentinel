import * as SecureStore from 'expo-secure-store';

const SESSION_TOKEN_KEY = 'sentinel.sessionToken';
const LOCAL_KEY_REF_KEY = 'sentinel.localKeyRef';

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

export async function getLocalKeyRef(): Promise<string | null> {
  return SecureStore.getItemAsync(LOCAL_KEY_REF_KEY);
}

export async function setLocalKeyRef(value: string): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_KEY_REF_KEY, value);
}

export async function getOrCreateLocalKeyRef(
  generate: () => string,
): Promise<string> {
  const existing = await getLocalKeyRef();

  if (existing) {
    return existing;
  }

  const created = generate();
  await setLocalKeyRef(created);
  return created;
}
