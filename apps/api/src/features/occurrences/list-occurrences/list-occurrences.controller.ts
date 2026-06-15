import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../../identity/session/session.guard';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { ListOccurrencesHandler } from './list-occurrences.handler';

@Controller('occurrences')
export class ListOccurrencesController {
  constructor(private readonly handler: ListOccurrencesHandler) {}

  @Get()
  @UseGuards(SessionGuard)
  list(
    @Query() query: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(query, request.session);
  }
}
