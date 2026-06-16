import { DEFAULT_API_URL } from './config';

const EMULATOR_API_URL = 'http://10.0.2.2:3010';
const USB_REVERSE_API_URL = 'http://127.0.0.1:3010';

let cachedBaseUrl: string | null = null;

export function getApiUrlCandidates(): string[] {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;

  return [...new Set([USB_REVERSE_API_URL, configured, EMULATOR_API_URL])];
}

export function getCachedApiBaseUrl(): string | null {
  return cachedBaseUrl;
}

export function resetApiBaseUrlCache(): void {
  cachedBaseUrl = null;
}

export async function resolveApiBaseUrl(): Promise<string> {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  for (const candidate of getApiUrlCandidates()) {
    const isReachable = await probeApiHealth(candidate);

    if (isReachable) {
      cachedBaseUrl = candidate;
      return candidate;
    }
  }

  return process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_API_URL;
}

async function probeApiHealth(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 2500);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
