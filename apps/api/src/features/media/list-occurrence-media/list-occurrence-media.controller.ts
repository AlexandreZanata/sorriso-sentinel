import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../../identity/session/session.guard';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { ListOccurrenceMediaHandler } from './list-occurrence-media.handler';

@Controller('occurrences')
export class ListOccurrenceMediaController {
  constructor(private readonly handler: ListOccurrenceMediaHandler) {}

  @Get(':occurrenceId/media')
  @UseGuards(SessionGuard)
  list(
    @Param('occurrenceId') occurrenceId: string,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(occurrenceId, request.session);
  }
}
