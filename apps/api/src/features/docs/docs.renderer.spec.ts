import { describe, expect, it } from 'vitest';
import { DocsRenderer } from './docs.renderer.js';

describe('DocsRenderer', () => {
  const renderer = new DocsRenderer();

  it('should_render_html_with_all_endpoints', () => {
    const html = renderer.renderHtml('http://127.0.0.1:3010', 'en');

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('/occurrences/:id/confirm');
    expect(html).toContain('/user-accounts/me');
    expect(html).toContain('/docs/spec.json');
    expect(html).toContain('docs-theme-toggle');
    expect(html).toContain('lang-switch');
    expect(html).toContain('data-i18n');
    expect(html).toContain('Seed data');
    expect(html).toContain('Try it');
    expect(html).toContain('docs-auth-token');
  });

  it('should_return_spec_with_eighteen_endpoints', () => {
    const spec = renderer.getSpec('http://127.0.0.1:3010');

    expect(spec.endpoints).toHaveLength(18);
    expect(spec.baseUrl).toBe('http://127.0.0.1:3010');
  });

  it('should_render_portuguese_when_locale_is_pt', () => {
    const html = renderer.renderHtml('http://127.0.0.1:3010', 'pt');

    expect(html).toContain('lang="pt"');
    expect(html).toContain('Dados seed');
    expect(html).toContain('Testar requisições');
  });
});
