import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { SessionGuard } from '../session/session.guard';
import { RotateIdentityHandler } from './rotate-identity.handler';

@Controller('identity')
export class RotateIdentityController {
  constructor(private readonly handler: RotateIdentityHandler) {}

  @Post('rotate')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  rotate(
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(body, request.session!);
  }
}
