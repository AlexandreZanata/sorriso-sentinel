import type { DocsLocale } from '../../i18n/index.js';
import { t } from '../../i18n/index.js';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function methodBadge(method: string): string {
  const normalized = method.toLowerCase();
  return `<span class="method method-${normalized}">${escapeHtml(method)}</span>`;
}

export function authBadge(auth: 'public' | 'session', locale: DocsLocale): string {
  const key = auth === 'public' ? 'badge.public' : 'badge.session';
  return `<span class="badge badge-${auth}" data-i18n="${key}">${escapeHtml(t(locale, key))}</span>`;
}

export function statusBadge(status: number): string {
  const tone = status >= 500 ? '5xx' : status >= 400 ? '4xx' : status >= 300 ? '3xx' : '2xx';
  return `<span class="status status-${tone}">${status}</span>`;
}

export function i18nText(locale: DocsLocale, key: string, tag = 'span'): string {
  return `<${tag} data-i18n="${escapeHtml(key)}">${escapeHtml(t(locale, key))}</${tag}>`;
}
