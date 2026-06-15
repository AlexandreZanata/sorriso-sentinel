import { Module } from '@nestjs/common';
import { DocsController } from './docs.controller.js';
import { DocsRenderer } from './docs.renderer.js';

@Module({
  controllers: [DocsController],
  providers: [DocsRenderer],
})
export class DocsModule {}
