import type { DocsLocale } from './locale.js';
import { MESSAGES_EN } from './messages.en.js';
import { MESSAGES_PT } from './messages.pt.js';

export const DOCS_MESSAGES: Record<DocsLocale, Record<string, string>> = {
  en: MESSAGES_EN,
  pt: MESSAGES_PT,
};

export function t(
  locale: DocsLocale,
  key: string,
  params?: Record<string, string | number>,
): string {
  let text = DOCS_MESSAGES[locale][key] ?? DOCS_MESSAGES.en[key] ?? key;

  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replace(`{${paramKey}}`, String(paramValue));
    }
  }

  return text;
}

const GROUP_KEYS: Record<string, string> = {
  Health: 'group.health',
  Sessions: 'group.sessions',
  Occurrences: 'group.occurrences',
  Validation: 'group.validation',
  Media: 'group.media',
  Identity: 'group.identity',
  Auth: 'group.auth',
  'User accounts': 'group.userAccounts',
  Admin: 'group.admin',
};

const SEED_GROUP_KEYS = ['tenant', 'session', 'identity', 'occurrence', 'flow'] as const;

export function groupKey(group: string): string {
  return GROUP_KEYS[group] ?? group;
}

export function seedGroupKey(index: number): string {
  return `seedGroup.${SEED_GROUP_KEYS[index] ?? 'tenant'}`;
}

export function endpointSummaryKey(endpointId: string): string {
  return `endpoint.${endpointId}.summary`;
}

export function endpointDescriptionKey(endpointId: string): string {
  return `endpoint.${endpointId}.description`;
}

export function presetKey(presetId: string): string {
  return `preset.${presetId}`;
}

export function seedDescriptionKey(seedId: string): string {
  return `seed.${seedId}.description`;
}

export function seedLabelKey(seedId: string): string {
  return `seed.${seedId}.label`;
}
