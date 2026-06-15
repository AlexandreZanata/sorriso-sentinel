import type { SchemaField } from '@sorriso-sentinel/shared';
import type { DocsLocale } from '../../i18n/index.js';
import { escapeHtml } from '../atoms/badges.js';
import { t } from '../../i18n/index.js';

function renderFieldRow(field: SchemaField, locale: DocsLocale): string {
  const requiredKey = field.required ? 'schema.required' : 'schema.optional';
  const required = `<span class="${field.required ? 'field-required' : 'field-optional'}" data-i18n="${requiredKey}">${escapeHtml(t(locale, requiredKey))}</span>`;
  const enumHtml = field.enumValues?.length
    ? `<div class="field-enum">${field.enumValues.map((v) => escapeHtml(v)).join(' | ')}</div>`
    : '';

  return `<tr>
    <td><code>${escapeHtml(field.name)}</code> ${required}</td>
    <td>${escapeHtml(field.type)}</td>
    <td>${escapeHtml(field.description)}${enumHtml}</td>
  </tr>`;
}

const TITLE_KEYS: Record<string, string> = {
  Headers: 'schema.headers',
  'Path parameters': 'schema.pathParams',
  'Query parameters': 'schema.queryParams',
  'Request body': 'schema.requestBody',
  'Response body': 'schema.responseBody',
};

export function schemaTable(title: string, fields: SchemaField[], locale: DocsLocale): string {
  if (fields.length === 0) {
    return '';
  }

  const titleKey = TITLE_KEYS[title] ?? title;
  const rows = fields.map((field) => renderFieldRow(field, locale)).join('');

  return `<div class="schema-table">
    <h4 class="schema-table__title" data-i18n="${titleKey}">${escapeHtml(t(locale, titleKey))}</h4>
    <table>
      <thead><tr>
        <th data-i18n="schema.field">${escapeHtml(t(locale, 'schema.field'))}</th>
        <th data-i18n="schema.type">${escapeHtml(t(locale, 'schema.type'))}</th>
        <th data-i18n="schema.description">${escapeHtml(t(locale, 'schema.description'))}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
