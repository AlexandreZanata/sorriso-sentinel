import type { ApiEndpointDoc } from '@sorriso-sentinel/shared';
import type { DocsLocale } from '../../i18n/index.js';
import { escapeHtml } from '../atoms/badges.js';
import { t } from '../../i18n/index.js';

function extractPathParams(path: string): string[] {
  const matches = path.match(/:([a-zA-Z]+)/g);
  return matches ? matches.map((segment) => segment.slice(1)) : [];
}

function defaultPathParamValue(name: string): string {
  const defaults: Record<string, string> = {
    id: '01932f1a-0000-7000-8000-000000000042',
  };
  return defaults[name] ?? '';
}

function renderPathParamInputs(endpointId: string, path: string): string {
  const params = extractPathParams(path);
  if (params.length === 0) {
    return '';
  }

  const inputs = params
    .map(
      (name) => `<div class="try-it__param">
      <label class="try-it__param-label" for="try-param-${escapeHtml(endpointId)}-${escapeHtml(name)}">${escapeHtml(name)}</label>
      <input id="try-param-${escapeHtml(endpointId)}-${escapeHtml(name)}" class="try-it__param-input" type="text" data-path-param="${escapeHtml(name)}" value="${escapeHtml(defaultPathParamValue(name))}" spellcheck="false" />
    </div>`,
    )
    .join('');

  return `<div class="try-it__params">${inputs}</div>`;
}

export function endpointTryIt(endpoint: ApiEndpointDoc, locale: DocsLocale): string {
  const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE';
  const bodyExample = endpoint.requestBody?.example;
  const bodyJson =
    bodyExample !== undefined ? JSON.stringify(bodyExample, null, 2) : '{\n  \n}';

  const bodySection = hasBody
    ? `<label class="try-it__body-label" for="try-body-${escapeHtml(endpoint.id)}" data-i18n="tryIt.requestBody">${escapeHtml(t(locale, 'tryIt.requestBody'))}</label>
       <textarea id="try-body-${escapeHtml(endpoint.id)}" class="try-it__body" rows="6" spellcheck="false">${escapeHtml(bodyJson)}</textarea>`
    : '';

  return `<div class="try-it" data-endpoint-id="${escapeHtml(endpoint.id)}" data-method="${escapeHtml(endpoint.method)}" data-path="${escapeHtml(endpoint.path)}" data-auth="${escapeHtml(endpoint.auth)}">
    <div class="try-it__header">
      <span class="try-it__title" data-i18n="tryIt.title">${escapeHtml(t(locale, 'tryIt.title'))}</span>
      <span class="try-it__url-preview" data-url-preview></span>
    </div>
    ${renderPathParamInputs(endpoint.id, endpoint.path)}
    ${bodySection}
    <div class="try-it__actions">
      <button type="button" class="try-it__send btn-primary" data-send data-i18n="tryIt.send">${escapeHtml(t(locale, 'tryIt.send'))}</button>
      <span class="try-it__status" data-status aria-live="polite"></span>
    </div>
    <div class="try-it__response" data-response hidden>
      <div class="try-it__response-meta" data-response-meta></div>
      <pre class="try-it__response-body" data-response-body></pre>
    </div>
  </div>`;
}
