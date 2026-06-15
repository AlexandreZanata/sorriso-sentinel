import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { LoginHandler } from './login.handler';

@Controller('auth')
export class LoginController {
  constructor(private readonly handler: LoginHandler) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    return this.handler.execute(body);
  }
}
