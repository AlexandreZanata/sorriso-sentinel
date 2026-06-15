export const AUDIT_ACTIONS = [
  'occurrence_created',
  'occurrence_status_changed',
  'occurrence_updated',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ACTOR_TYPES = [
  'contributor',
  'user_account',
  'system',
] as const;

export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];
