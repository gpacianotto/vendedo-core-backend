import { Module } from '@nestjs/common';
import { FollowUpsModule } from '../follow-ups/follow-ups.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [FollowUpsModule, OpportunitiesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
