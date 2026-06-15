import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { SessionGuard } from '../../identity/session/session.guard';
import { ListCommentsHandler } from './list-comments.handler';

@Controller('occurrences')
export class ListCommentsController {
  constructor(private readonly handler: ListCommentsHandler) {}

  @Get(':occurrenceId/comments')
  @UseGuards(SessionGuard)
  list(
    @Param('occurrenceId') occurrenceId: string,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(occurrenceId, request.session);
  }
}
