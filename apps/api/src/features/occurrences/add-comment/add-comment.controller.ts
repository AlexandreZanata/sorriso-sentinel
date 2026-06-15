import {
  Body,
  Controller,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { SessionClaims } from '../../../infrastructure/auth/hmac-session-token.service';
import { SessionGuard } from '../../identity/session/session.guard';
import { AddCommentHandler } from './add-comment.handler';

@Controller('occurrences')
export class AddCommentController {
  constructor(private readonly handler: AddCommentHandler) {}

  @Post(':id/comments')
  @HttpCode(201)
  @UseGuards(SessionGuard)
  addComment(
    @Param('id') occurrenceId: string,
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.handler.execute(occurrenceId, body, request.session!);
  }
}
