import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [IdentityModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}
