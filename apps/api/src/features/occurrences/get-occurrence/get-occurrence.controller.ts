import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../../identity/session/session.guard';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { GetOccurrenceHandler } from './get-occurrence.handler';

@Controller('occurrences')
export class GetOccurrenceController {
  constructor(private readonly handler: GetOccurrenceHandler) {}

  @Get(':id')
  @UseGuards(SessionGuard)
  getById(
    @Param('id') id: string,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(id, request.session);
  }
}
