import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('live')
  getLive(): { status: string } {
    return { status: 'live' };
  }

  @Get('ready')
  getReady(): { status: string } {
    return { status: 'ready' };
  }
}
