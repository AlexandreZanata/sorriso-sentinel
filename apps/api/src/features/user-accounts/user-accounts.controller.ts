import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../identity/session/session.guard';
import type { SessionClaims } from '../../infrastructure/auth/hmac-session-token.service';
import { GetMyAccountHandler } from './get-my-account/get-my-account.handler';
import { RegisterUserAccountHandler } from './register-user-account/register-user-account.handler';
import { RequestErasureHandler } from './request-erasure/request-erasure.handler';
import { UpdateMyAccountHandler } from './update-my-account/update-my-account.handler';
import { UpdateProfilePhotoHandler } from './update-profile-photo/update-profile-photo.handler';
import { VerifyEmailHandler } from './verify-email/verify-email.handler';

@Controller('user-accounts')
export class UserAccountsController {
  constructor(
    private readonly registerHandler: RegisterUserAccountHandler,
    private readonly verifyEmailHandler: VerifyEmailHandler,
    private readonly getMyAccountHandler: GetMyAccountHandler,
    private readonly updateMyAccountHandler: UpdateMyAccountHandler,
    private readonly updateProfilePhotoHandler: UpdateProfilePhotoHandler,
    private readonly requestErasureHandler: RequestErasureHandler,
  ) {}

  @Post('register')
  @HttpCode(201)
  @UseGuards(SessionGuard)
  register(
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.registerHandler.execute(body, request.session!);
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() body: unknown) {
    return this.verifyEmailHandler.execute(body);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  getMe(@Req() request: { session?: SessionClaims }) {
    return this.getMyAccountHandler.execute(request.session!);
  }

  @Patch('me')
  @UseGuards(SessionGuard)
  updateMe(
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.updateMyAccountHandler.execute(body, request.session!);
  }

  @Patch('me/profile-photo')
  @UseGuards(SessionGuard)
  updateProfilePhoto(
    @Body() body: unknown,
    @Req() request: { session?: SessionClaims },
  ) {
    return this.updateProfilePhotoHandler.execute(body, request.session!);
  }

  @Delete('me')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  async requestErasure(@Req() request: { session?: SessionClaims }) {
    await this.requestErasureHandler.execute(request.session!);
  }
}
