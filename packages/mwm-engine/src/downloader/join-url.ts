function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '');
}

/** Mirrors CoMaps `url::Join` used for map file paths. */
export function joinUrl(base: string, ...segments: string[]): string {
  const parts = [trimTrailingSlash(base)];

  for (const segment of segments) {
    parts.push(trimLeadingSlash(segment));
  }

  return parts.join('/');
}
