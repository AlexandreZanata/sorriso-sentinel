import type { ApiDocumentationSpec, ApiEndpointDoc } from '@sorriso-sentinel/shared';
import { DOCS_MESSAGES } from '../../i18n/index.js';
import type { DocsLocale } from '../../i18n/index.js';
import { t } from '../../i18n/index.js';
import { docsClientScript } from '../../docs.client-script.js';
import { escapeHtml } from '../atoms/badges.js';
import { codeBlock } from '../atoms/code-block.js';
import { endpointTryIt } from '../molecules/endpoint-try-it.js';
import { endpointHeader } from '../molecules/endpoint-header.js';
import { errorTable } from '../molecules/error-table.js';
import { schemaTable } from '../molecules/schema-table.js';
import { testConsolePanel } from '../molecules/test-console.js';
import { docsHeader } from './docs-header.js';
import { sidebar } from './sidebar.js';

function renderEndpointBody(endpoint: ApiEndpointDoc, locale: DocsLocale): string {
  const sections: string[] = [];

  sections.push(endpointTryIt(endpoint, locale));

  if (endpoint.headers?.length) {
    sections.push(schemaTable('Headers', endpoint.headers, locale));
  }
  if (endpoint.pathParams?.length) {
    sections.push(schemaTable('Path parameters', endpoint.pathParams, locale));
  }
  if (endpoint.queryParams?.length) {
    sections.push(schemaTable('Query parameters', endpoint.queryParams, locale));
  }
  if (endpoint.requestBody) {
    sections.push(schemaTable('Request body', endpoint.requestBody.fields, locale));
    sections.push(codeBlock(endpoint.requestBody.example, 'schema.exampleRequest', locale));
  }
  if (endpoint.responseBody) {
    sections.push(schemaTable('Response body', endpoint.responseBody.fields, locale));
    sections.push(codeBlock(endpoint.responseBody.example, 'schema.exampleResponse', locale));
  }

  sections.push(errorTable(endpoint.errors, locale));

  return sections.filter(Boolean).join('');
}

function endpointSection(endpoint: ApiEndpointDoc, locale: DocsLocale): string {
  return `<article class="endpoint-section" data-endpoint-id="${escapeHtml(endpoint.id)}">
    ${endpointHeader(endpoint, locale)}
    <div class="endpoint-section__body">${renderEndpointBody(endpoint, locale)}</div>
  </article>`;
}

function serializeClientConfig(spec: ApiDocumentationSpec): string {
  const payload = {
    messages: DOCS_MESSAGES,
    endpointCount: spec.endpoints.length,
    baseUrlPresets: spec.baseUrlPresets,
    seedGroups: spec.seedGroups,
    endpoints: spec.endpoints.map((endpoint) => ({
      id: endpoint.id,
      method: endpoint.method,
      path: endpoint.path,
      auth: endpoint.auth,
    })),
  };

  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

function localeBootstrapScript(): string {
  return `(function(){var k='sentinel-docs-locale';var l;try{l=localStorage.getItem(k);}catch(e){}if(l!=='pt'&&l!=='en'){l=(navigator.language||'en').toLowerCase().startsWith('pt')?'pt':'en';}document.documentElement.lang=l;document.documentElement.setAttribute('data-locale',l);})();`;
}

export function docsLayout(spec: ApiDocumentationSpec, css: string, locale: DocsLocale): string {
  const authNotes = [0, 1, 2, 3]
    .map(
      (index) =>
        `<li data-i18n="auth.note.${index}">${escapeHtml(t(locale, `auth.note.${index}`))}</li>`,
    )
    .join('');

  const endpointSections = spec.endpoints.map((endpoint) => endpointSection(endpoint, locale)).join('');
  const footerText = t(locale, 'footer.generated', { count: spec.endpoints.length });

  return `<!DOCTYPE html>
<html lang="${locale}" data-theme="dark" data-locale="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(spec.title)} — ${escapeHtml(t(locale, 'meta.titleSuffix'))}</title>
  <script>${localeBootstrapScript()}</script>
  <style>${css}</style>
</head>
<body>
  <div class="docs-shell">
    ${sidebar(spec, locale)}
    <div class="docs-content">
      ${docsHeader(spec, locale)}
      <main class="docs-main">
        <section class="docs-intro">
          <p class="docs-intro__description" data-i18n="spec.description">${escapeHtml(t(locale, 'spec.description'))}</p>
          <div class="docs-intro__meta">
            <span><span data-i18n="intro.defaultBaseUrl">${escapeHtml(t(locale, 'intro.defaultBaseUrl'))}</span> <code>${escapeHtml(spec.baseUrl)}</code></span>
            <span><span data-i18n="intro.exampleCity">${escapeHtml(t(locale, 'intro.exampleCity'))}</span> <code>${escapeHtml(spec.exampleCityId)}</code></span>
          </div>
          <div class="docs-intro__auth">
            <h3 data-i18n="intro.authTitle">${escapeHtml(t(locale, 'intro.authTitle'))}</h3>
            <ul>${authNotes}</ul>
          </div>
        </section>
        ${testConsolePanel(spec, locale)}
        <section class="endpoint-list">${endpointSections}</section>
        <footer class="docs-footer" data-i18n="footer.generated" data-i18n-params='{"count":${spec.endpoints.length}}'>
          ${escapeHtml(footerText)}
        </footer>
      </main>
    </div>
  </div>
  <script type="application/json" id="docs-client-config">${serializeClientConfig(spec)}</script>
  <script>${docsClientScript}</script>
</body>
</html>`;
}
