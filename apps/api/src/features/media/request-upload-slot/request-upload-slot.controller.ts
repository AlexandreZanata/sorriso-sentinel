import {
  BadRequestException,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import { SessionGuard } from '../../identity/session/session.guard';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { RequestUploadSlotHandler } from './request-upload-slot.handler';

@Controller('occurrences')
export class RequestUploadSlotController {
  constructor(private readonly handler: RequestUploadSlotHandler) {}

  @Post(':occurrenceId/media/upload-slots')
  @UseGuards(SessionGuard)
  requestSlot(
    @Param('occurrenceId') occurrenceId: string,
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(occurrenceId, body, request.session);
  }
}
