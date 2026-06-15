const STRIPPED_FIELDS = new Set([
  'description',
  'pseudonym',
  'email',
  'displayName',
  'contributorReputationId',
  'reputationId',
  'localKeyFingerprint',
  'localKeyRef',
]);

export function sanitizeAuditSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!snapshot) {
    return null;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(snapshot)) {
    if (STRIPPED_FIELDS.has(key)) {
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}
