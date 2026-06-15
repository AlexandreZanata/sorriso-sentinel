import { Injectable } from '@nestjs/common';
import type { ApiDocumentationSpec } from '@sorriso-sentinel/shared';
import { getApiDocumentationSpec } from '@sorriso-sentinel/shared';
import type { DocsLocale } from './i18n/index.js';
import { DOCS_STYLES } from './docs.styles.js';
import { docsLayout } from './ui/organisms/docs-layout.js';

@Injectable()
export class DocsRenderer {
  renderHtml(baseUrl: string, locale: DocsLocale): string {
    const spec = getApiDocumentationSpec(baseUrl);
    return docsLayout(spec, DOCS_STYLES, locale);
  }

  getSpec(baseUrl: string): ApiDocumentationSpec {
    return getApiDocumentationSpec(baseUrl);
  }
}
