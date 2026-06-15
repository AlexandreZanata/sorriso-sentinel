import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { denyOccurrenceSchema } from '@sorriso-sentinel/shared';
import { SessionGuard } from '../../identity/session/session.guard';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { CastValidationVoteHandler } from '../cast-validation-vote/cast-validation-vote.handler';

@Controller('occurrences')
export class DenyOccurrenceController {
  constructor(private readonly handler: CastValidationVoteHandler) {}

  @Post(':id/deny')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  deny(
    @Param('id') occurrenceId: string,
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    const parsed = denyOccurrenceSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    return this.handler.execute({
      occurrenceId,
      voteType: 'deny',
      version: parsed.data.version,
      reason: parsed.data.reason,
      session: request.session!,
    });
  }
}
