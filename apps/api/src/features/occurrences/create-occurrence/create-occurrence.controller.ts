import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../../identity/session/session.guard';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { CreateOccurrenceHandler } from './create-occurrence.handler';

@Controller('occurrences')
export class CreateOccurrenceController {
  constructor(private readonly handler: CreateOccurrenceHandler) {}

  @Post()
  @HttpCode(201)
  @UseGuards(SessionGuard)
  create(
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(body, request.session);
  }
}
