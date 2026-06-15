import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/guards/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { SessionGuard } from '../identity/session/session.guard';

@Controller('admin')
export class AdminController {
  @Get('audit-summary')
  @UseGuards(SessionGuard, TenantGuard, RolesGuard)
  @Roles('city_admin')
  auditSummary() {
    return {
      status: 'ok',
      message: 'Admin audit summary available',
    };
  }
}
