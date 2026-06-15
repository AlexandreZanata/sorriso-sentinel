import type { ApiEndpointDoc } from '@sorriso-sentinel/shared';
import type { DocsLocale } from '../../i18n/index.js';
import { authBadge, escapeHtml } from '../atoms/badges.js';
import { inlineCode } from '../atoms/code-block.js';
import { endpointDescriptionKey, endpointSummaryKey, t } from '../../i18n/index.js';

export function endpointHeader(endpoint: ApiEndpointDoc, locale: DocsLocale): string {
  const summaryKey = endpointSummaryKey(endpoint.id);
  const descriptionKey = endpointDescriptionKey(endpoint.id);
  const statuses = endpoint.statusCodes
    .map((item) => `${statusBadge(item.status)} ${escapeHtml(item.description)}`)
    .join(' ');

  return `<header class="endpoint-header">
    <div class="endpoint-header__line">
      ${methodBadge(endpoint.method)}
      ${inlineCode(endpoint.path)}
      ${authBadge(endpoint.auth, locale)}
    </div>
    <h2 id="${escapeHtml(endpoint.id)}" class="endpoint-header__title" data-i18n="${summaryKey}">${escapeHtml(t(locale, summaryKey))}</h2>
    <p class="endpoint-header__description" data-i18n="${descriptionKey}">${escapeHtml(t(locale, descriptionKey))}</p>
    <div class="endpoint-header__statuses">${statuses}</div>
  </header>`;
}

function methodBadge(method: string): string {
  const normalized = method.toLowerCase();
  return `<span class="method method-${normalized}">${escapeHtml(method)}</span>`;
}

function statusBadge(status: number): string {
  const tone = status >= 500 ? '5xx' : status >= 400 ? '4xx' : status >= 300 ? '3xx' : '2xx';
  return `<span class="status status-${tone}">${status}</span>`;
}
