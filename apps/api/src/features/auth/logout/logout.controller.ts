import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LogoutHandler } from './logout.handler';

@Controller('auth')
export class LogoutController {
  constructor(private readonly handler: LogoutHandler) {}

  @Post('logout')
  @HttpCode(200)
  logout(@Body() body: unknown) {
    return this.handler.execute(body);
  }
}
