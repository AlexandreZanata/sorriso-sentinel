import {
  Body,
  Controller,
  HttpCode,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { SessionGuard } from '../session/session.guard';
import { ChangeIdentityModeHandler } from './change-identity-mode.handler';

@Controller('identity')
export class ChangeIdentityModeController {
  constructor(private readonly handler: ChangeIdentityModeHandler) {}

  @Patch('mode')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  changeMode(
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(body, request.session!);
  }
}
