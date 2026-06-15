import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RefreshTokenHandler } from './refresh-token.handler';

@Controller('auth')
export class RefreshTokenController {
  constructor(private readonly handler: RefreshTokenHandler) {}

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: unknown) {
    return this.handler.execute(body);
  }
}
