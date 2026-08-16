import { Controller, Get } from '@nestjs/common';
import { Public } from './common/auth/public.decorator';
import { AppService, HealthStatus } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  getHealth(): Promise<HealthStatus> {
    return this.appService.getHealth();
  }
}
