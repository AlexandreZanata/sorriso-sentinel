import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../../identity/session/session.guard';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { CompleteUploadHandler } from './complete-upload.handler';

@Controller('media/upload-slots')
export class CompleteUploadController {
  constructor(private readonly handler: CompleteUploadHandler) {}

  @Post(':slotId/complete')
  @HttpCode(202)
  @UseGuards(SessionGuard)
  complete(
    @Param('slotId') slotId: string,
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(slotId, body, request.session);
  }
}
