import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { BootstrapSessionHandler } from './bootstrap-session.handler';

@Controller('sessions')
export class BootstrapSessionController {
  constructor(private readonly handler: BootstrapSessionHandler) {}

  @Post('bootstrap')
  @HttpCode(201)
  bootstrap(@Body() body: unknown) {
    return this.handler.execute(body);
  }
}
