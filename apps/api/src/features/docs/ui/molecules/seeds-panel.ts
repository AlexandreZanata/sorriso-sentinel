import type { ApiDocumentationSpec } from '@sorriso-sentinel/shared';
import type { DocsLocale } from '../../i18n/index.js';
import { escapeHtml } from '../atoms/badges.js';
import { ICON_COPY } from '../atoms/icons.js';
import {
  seedDescriptionKey,
  seedGroupKey,
  seedLabelKey,
  t,
} from '../../i18n/index.js';
import { DOCS_MESSAGES } from '../../i18n/index.js';

function resolveSeedLabel(itemId: string, fallback: string, locale: DocsLocale): string {
  const key = seedLabelKey(itemId);
  return DOCS_MESSAGES[locale][key] ?? DOCS_MESSAGES.en[key] ?? fallback;
}

export function seedsPanel(spec: ApiDocumentationSpec, locale: DocsLocale): string {
  const groups = spec.seedGroups
    .map((group, index) => {
      const groupKey = seedGroupKey(index);
      const items = group.items
        .map((item) => {
          const label = resolveSeedLabel(item.id, item.label, locale);
          const descKey = seedDescriptionKey(item.id);
          return `<div class="seed-item" data-seed-id="${escapeHtml(item.id)}">
        <div class="seed-item__head">
          <span class="seed-item__label">${escapeHtml(label)}</span>
          <button type="button" class="seed-item__copy" data-seed-id="${escapeHtml(item.id)}" data-i18n-title="sidebar.copy" title="${escapeHtml(t(locale, 'sidebar.copy'))}" data-i18n-aria="sidebar.copyItem" aria-label="${escapeHtml(t(locale, 'sidebar.copyItem', { label }))}">
            ${ICON_COPY}
          </button>
        </div>
        <pre class="seed-item__value">${escapeHtml(item.value)}</pre>
        <p class="seed-item__description" data-i18n="${descKey}">${escapeHtml(t(locale, descKey))}</p>
      </div>`;
        })
        .join('');

      return `<div class="seed-group">
        <h3 class="seed-group__title" data-i18n="${groupKey}">${escapeHtml(t(locale, groupKey))}</h3>
        ${items}
      </div>`;
    })
    .join('');

  return `<div class="sidebar-panel sidebar-panel--seeds" id="sidebar-seeds" role="tabpanel" data-i18n-aria="sidebar.seeds.aria" aria-label="${escapeHtml(t(locale, 'sidebar.seeds.aria'))}">
    <p class="sidebar-panel__intro" data-i18n="sidebar.seeds.intro">${escapeHtml(t(locale, 'sidebar.seeds.intro'))}</p>
    ${groups}
  </div>`;
}
