export interface CountriesCatalog {
  dataVersion: number;
  mapSeries: string;
  regions: Map<string, CatalogRegion>;
}

export interface CatalogRegion {
  id: string;
  sizeBytes: number;
  sha1Base64: string;
}

interface CountriesJsonNode {
  id?: string;
  v?: number;
  map_series?: string;
  s?: number;
  sha1_base64?: string;
  g?: CountriesJsonNode[];
}

/** Parses CoMaps `countries.txt` JSON and indexes leaf regions by id. */
export function parseCountriesCatalog(jsonText: string): CountriesCatalog | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const root = parsed as CountriesJsonNode;
  const dataVersion = root.v;
  const mapSeries = root.map_series;

  if (typeof dataVersion !== 'number' || typeof mapSeries !== 'string') {
    return null;
  }

  const regions = new Map<string, CatalogRegion>();
  collectRegions(root.g ?? [], regions);

  return {
    dataVersion,
    mapSeries,
    regions,
  };
}

function collectRegions(
  nodes: CountriesJsonNode[],
  regions: Map<string, CatalogRegion>,
): void {
  for (const node of nodes) {
    if (!node.id) {
      continue;
    }

    if (Array.isArray(node.g) && node.g.length > 0) {
      collectRegions(node.g, regions);
      continue;
    }

    if (typeof node.s !== 'number' || typeof node.sha1_base64 !== 'string') {
      continue;
    }

    regions.set(node.id, {
      id: node.id,
      sizeBytes: node.s,
      sha1Base64: node.sha1_base64,
    });
  }
}
