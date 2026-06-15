import type { ApiBaseUrlPreset, ApiDocumentationSpec } from '@sorriso-sentinel/shared';
import type { DocsLocale } from '../../i18n/index.js';
import { escapeHtml } from '../atoms/badges.js';
import { presetKey, t } from '../../i18n/index.js';

function renderPresetOptions(presets: ApiBaseUrlPreset[], selectedUrl: string, locale: DocsLocale): string {
  return presets
    .map((preset) => {
      const selected = preset.id !== 'custom' && preset.url === selectedUrl ? ' selected' : '';
      const key = presetKey(preset.id);
      return `<option value="${escapeHtml(preset.id)}" data-url="${escapeHtml(preset.url)}" data-i18n="${key}"${selected}>${escapeHtml(t(locale, key))}</option>`;
    })
    .join('');
}

export function testConsolePanel(spec: ApiDocumentationSpec, locale: DocsLocale): string {
  const presets = renderPresetOptions(spec.baseUrlPresets, spec.baseUrl, locale);

  return `<section class="test-console" id="test-console" data-i18n-aria="testConsole.aria" aria-label="${escapeHtml(t(locale, 'testConsole.aria'))}">
    <div class="test-console__header">
      <h2 class="test-console__title" data-i18n="testConsole.title">${escapeHtml(t(locale, 'testConsole.title'))}</h2>
      <p class="test-console__subtitle" data-i18n="testConsole.subtitle">${escapeHtml(t(locale, 'testConsole.subtitle'))}</p>
    </div>
    <div class="test-console__grid">
      <div class="test-console__field">
        <label class="test-console__label" for="docs-base-preset" data-i18n="testConsole.environment">${escapeHtml(t(locale, 'testConsole.environment'))}</label>
        <select id="docs-base-preset" class="test-console__select">${presets}</select>
      </div>
      <div class="test-console__field test-console__field--grow">
        <label class="test-console__label" for="docs-base-url" data-i18n="testConsole.baseUrl">${escapeHtml(t(locale, 'testConsole.baseUrl'))}</label>
        <input id="docs-base-url" class="test-console__input" type="url" value="${escapeHtml(spec.baseUrl)}" placeholder="https://api.example.com" spellcheck="false" />
      </div>
    </div>
    <div class="test-console__field">
      <label class="test-console__label" for="docs-auth-token">
        <span data-i18n="testConsole.bearerToken">${escapeHtml(t(locale, 'testConsole.bearerToken'))}</span>
        <span class="test-console__hint" data-i18n="testConsole.tokenHint">${escapeHtml(t(locale, 'testConsole.tokenHint'))}</span>
      </label>
      <div class="test-console__token-row">
        <input id="docs-auth-token" class="test-console__input test-console__input--token" type="password" data-i18n-placeholder="testConsole.tokenPlaceholder" placeholder="${escapeHtml(t(locale, 'testConsole.tokenPlaceholder'))}" autocomplete="off" spellcheck="false" />
        <button type="button" id="docs-token-toggle" class="test-console__btn test-console__btn--ghost" data-i18n="testConsole.show">${escapeHtml(t(locale, 'testConsole.show'))}</button>
        <button type="button" id="docs-token-clear" class="test-console__btn test-console__btn--ghost" data-i18n="testConsole.clear">${escapeHtml(t(locale, 'testConsole.clear'))}</button>
      </div>
    </div>
  </section>`;
}
