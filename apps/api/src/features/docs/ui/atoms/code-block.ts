import type { DocsLocale } from '../../i18n/index.js';
import { escapeHtml } from './badges.js';
import { t } from '../../i18n/index.js';

export function codeBlock(json: unknown, labelKey: string, locale: DocsLocale): string {
  const content = escapeHtml(JSON.stringify(json, null, 2));
  const labelHtml = labelKey
    ? `<div class="code-block__label" data-i18n="${escapeHtml(labelKey)}">${escapeHtml(t(locale, labelKey))}</div>`
    : '';

  return `<div class="code-block">${labelHtml}<pre><code>${content}</code></pre></div>`;
}

export function inlineCode(value: string): string {
  return `<code class="inline-code">${escapeHtml(value)}</code>`;
}
