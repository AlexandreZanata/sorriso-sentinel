import type { ApiDocumentationSpec } from '@sorriso-sentinel/shared';
import type { DocsLocale } from '../../i18n/index.js';
import { escapeHtml } from '../atoms/badges.js';
import { ICON_MOON, ICON_SUN } from '../atoms/icons.js';
import { t } from '../../i18n/index.js';

export function docsHeader(spec: ApiDocumentationSpec, locale: DocsLocale): string {
  return `<header class="docs-topbar">
    <div class="docs-topbar__left">
      <p class="docs-topbar__eyebrow" data-i18n="header.eyebrow">${escapeHtml(t(locale, 'header.eyebrow'))}</p>
      <h1 class="docs-topbar__title">${escapeHtml(spec.title)}</h1>
    </div>
    <div class="docs-topbar__actions">
      <div class="lang-switch" role="group" aria-label="${escapeHtml(t(locale, 'header.langSwitch'))}" data-i18n-aria="header.langSwitch">
        <button type="button" class="lang-switch__btn" data-lang="pt" aria-pressed="false">PT</button>
        <button type="button" class="lang-switch__btn" data-lang="en" aria-pressed="false">EN</button>
      </div>
      <a class="docs-topbar__link" href="/docs/spec.json" data-i18n="header.specLink">${escapeHtml(t(locale, 'header.specLink'))}</a>
      <button type="button" id="docs-theme-toggle" class="theme-toggle" data-i18n-title="header.themeToggle" title="${escapeHtml(t(locale, 'header.themeToggle'))}" aria-label="${escapeHtml(t(locale, 'header.themeToggle'))}">
        <span class="theme-toggle__icon theme-toggle__icon--light">${ICON_SUN}</span>
        <span class="theme-toggle__icon theme-toggle__icon--dark">${ICON_MOON}</span>
      </button>
    </div>
  </header>`;
}
