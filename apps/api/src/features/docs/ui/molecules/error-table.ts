import type { ApiErrorCode } from '@sorriso-sentinel/shared';
import type { DocsLocale } from '../../i18n/index.js';
import { escapeHtml, statusBadge } from '../atoms/badges.js';
import { t } from '../../i18n/index.js';

export function errorTable(errors: ApiErrorCode[], locale: DocsLocale): string {
  if (errors.length === 0) {
    return '';
  }

  const rows = errors
    .map(
      (error) => `<tr>
        <td>${statusBadge(error.status)}</td>
        <td><code>${escapeHtml(error.code)}</code></td>
        <td>${escapeHtml(error.description)}</td>
      </tr>`,
    )
    .join('');

  return `<div class="error-table">
    <h4 class="error-table__title" data-i18n="schema.errorCodes">${escapeHtml(t(locale, 'schema.errorCodes'))}</h4>
    <table>
      <thead><tr>
        <th data-i18n="schema.status">${escapeHtml(t(locale, 'schema.status'))}</th>
        <th data-i18n="schema.code">${escapeHtml(t(locale, 'schema.code'))}</th>
        <th data-i18n="schema.description">${escapeHtml(t(locale, 'schema.description'))}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
