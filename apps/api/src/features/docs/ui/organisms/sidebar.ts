import type { ApiDocumentationSpec, ApiEndpointDoc } from '@sorriso-sentinel/shared';
import type { DocsLocale } from '../../i18n/index.js';
import { escapeHtml } from '../atoms/badges.js';
import { seedsPanel } from '../molecules/seeds-panel.js';
import { endpointSummaryKey, groupKey, t } from '../../i18n/index.js';

function navLink(endpoint: ApiEndpointDoc, locale: DocsLocale): string {
  const method = endpoint.method.toLowerCase();
  const summaryKey = endpointSummaryKey(endpoint.id);
  return `<li>
    <a href="#${escapeHtml(endpoint.id)}" class="nav-link" data-method="${method}">
      <span class="nav-link__method nav-link__method--${method}">${escapeHtml(endpoint.method)}</span>
      <span class="nav-link__text" data-i18n="${summaryKey}">${escapeHtml(t(locale, summaryKey))}</span>
    </a>
  </li>`;
}

function routesPanel(spec: ApiDocumentationSpec, locale: DocsLocale): string {
  const groups = new Map<string, ApiEndpointDoc[]>();

  for (const endpoint of spec.endpoints) {
    const list = groups.get(endpoint.group) ?? [];
    list.push(endpoint);
    groups.set(endpoint.group, list);
  }

  const groupHtml = [...groups.entries()]
    .map(([group, endpoints]) => {
      const gKey = groupKey(group);
      const links = endpoints.map((endpoint) => navLink(endpoint, locale)).join('');
      return `<div class="nav-group">
        <div class="nav-group__title" data-i18n="${gKey}">${escapeHtml(t(locale, gKey))}</div>
        <ul class="nav-group__list">${links}</ul>
      </div>`;
    })
    .join('');

  return `<div class="sidebar-panel sidebar-panel--routes sidebar-panel--active" id="sidebar-routes" role="tabpanel" data-i18n-aria="sidebar.routes.aria" aria-label="${escapeHtml(t(locale, 'sidebar.routes.aria'))}">
    ${groupHtml}
  </div>`;
}

export function sidebar(spec: ApiDocumentationSpec, locale: DocsLocale): string {
  return `<aside class="sidebar" data-i18n-aria="sidebar.aria" aria-label="${escapeHtml(t(locale, 'sidebar.aria'))}">
    <div class="sidebar__brand">
      <div class="sidebar__logo-mark">SS</div>
      <div class="sidebar__brand-text">
        <div class="sidebar__logo">Sorriso Sentinel</div>
        <div class="sidebar__version">API v${escapeHtml(spec.version)}</div>
      </div>
    </div>
    <div class="sidebar__tabs" role="tablist">
      <button type="button" class="sidebar-tab" role="tab" id="tab-seeds" aria-controls="sidebar-seeds" aria-selected="false" data-tab="seeds" data-i18n="sidebar.tab.seeds">${escapeHtml(t(locale, 'sidebar.tab.seeds'))}</button>
      <button type="button" class="sidebar-tab sidebar-tab--active" role="tab" id="tab-routes" aria-controls="sidebar-routes" aria-selected="true" data-tab="routes" data-i18n="sidebar.tab.routes">${escapeHtml(t(locale, 'sidebar.tab.routes'))}</button>
    </div>
    <div class="sidebar__panels">
      ${seedsPanel(spec, locale)}
      ${routesPanel(spec, locale)}
    </div>
  </aside>`;
}
