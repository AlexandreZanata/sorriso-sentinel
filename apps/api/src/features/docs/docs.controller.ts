import { Controller, Get, Header, Req } from '@nestjs/common';
import type { Request } from 'express';
import { resolveLocaleFromAcceptLanguage } from './i18n/index.js';
import { DocsRenderer } from './docs.renderer.js';

@Controller('docs')
export class DocsController {
  constructor(private readonly renderer: DocsRenderer) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderDocs(@Req() request: Request): string {
    const locale = resolveLocaleFromAcceptLanguage(request.headers['accept-language']);
    return this.renderer.renderHtml(this.resolveBaseUrl(request), locale);
  }

  @Get('spec.json')
  @Header('Content-Type', 'application/json; charset=utf-8')
  getSpec(@Req() request: Request) {
    return this.renderer.getSpec(this.resolveBaseUrl(request));
  }

  private resolveBaseUrl(request: Request): string {
    const configured = process.env.API_PUBLIC_URL?.trim();
    if (configured) {
      return configured.replace(/\/$/, '');
    }

    const host = request.get('host') ?? '127.0.0.1:3010';
    const protocol = request.protocol ?? 'http';
    return `${protocol}://${host}`;
  }
}
