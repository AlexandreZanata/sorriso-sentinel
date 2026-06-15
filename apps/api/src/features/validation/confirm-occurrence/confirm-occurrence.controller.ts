import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { confirmOccurrenceSchema } from '@sorriso-sentinel/shared';
import { SessionGuard } from '../../identity/session/session.guard';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { CastValidationVoteHandler } from '../cast-validation-vote/cast-validation-vote.handler';

@Controller('occurrences')
export class ConfirmOccurrenceController {
  constructor(private readonly handler: CastValidationVoteHandler) {}

  @Post(':id/confirm')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  confirm(
    @Param('id') occurrenceId: string,
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    const parsed = confirmOccurrenceSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        issues: parsed.error.issues,
      });
    }

    return this.handler.execute({
      occurrenceId,
      voteType: 'confirm',
      version: parsed.data.version,
      reason: parsed.data.reason,
      session: request.session!,
    });
  }
}
