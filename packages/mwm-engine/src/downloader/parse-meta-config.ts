export interface MetaConfig {
  servers: string[];
}

/** Mirrors CoMaps `downloader::ParseMetaConfig` (`servers_list.cpp`). */
export function parseMetaConfig(jsonText: string): MetaConfig | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  const servers = extractServers(parsed);

  if (servers.length === 0) {
    return null;
  }

  return { servers };
}

function extractServers(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  const serversValue = record.servers;

  if (!Array.isArray(serversValue)) {
    return [];
  }

  return serversValue.filter((entry): entry is string => typeof entry === 'string');
}
