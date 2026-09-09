import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/auth/roles.decorator';
import { BillingService, SubscriptionSummary } from './billing.service';

@Controller('tenant')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @Roles('OWNER')
  getSubscription(): Promise<SubscriptionSummary> {
    return this.billingService.getCurrent();
  }
}
