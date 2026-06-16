/** Turns CoMaps region ids into user-facing labels. */
export function formatRegionDisplayName(regionId: string): string {
  const parts = regionId.split('_');

  if (parts.length < 2) {
    return regionId.replace(/_/g, ' ');
  }

  const country = parts[0];
  if (!country) {
    return regionId.replace(/_/g, ' ');
  }

  const regionName = parts.slice(1).join(' ');

  if (country === 'Brazil') {
    return `${regionName}, Brazil`;
  }

  return `${regionName}, ${country.replace(/_/g, ' ')}`;
}
