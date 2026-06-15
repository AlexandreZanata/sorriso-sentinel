import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { GetMyAccountHandler } from './get-my-account/get-my-account.handler';
import { RegisterUserAccountHandler } from './register-user-account/register-user-account.handler';
import { RequestErasureHandler } from './request-erasure/request-erasure.handler';
import { UpdateMyAccountHandler } from './update-my-account/update-my-account.handler';
import { UpdateProfilePhotoHandler } from './update-profile-photo/update-profile-photo.handler';
import { UserAccountsController } from './user-accounts.controller';
import { VerifyEmailHandler } from './verify-email/verify-email.handler';

@Module({
  imports: [IdentityModule, AuthModule],
  controllers: [UserAccountsController],
  providers: [
    RegisterUserAccountHandler,
    VerifyEmailHandler,
    GetMyAccountHandler,
    UpdateMyAccountHandler,
    UpdateProfilePhotoHandler,
    RequestErasureHandler,
  ],
})
export class UserAccountsModule {}
