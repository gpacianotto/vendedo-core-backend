import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { UsersModule } from '../users/users.module';
import { FollowUp } from './entities/follow-up.entity';
import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsRepository } from './follow-ups.repository';
import { FollowUpsService } from './follow-ups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FollowUp]),
    OpportunitiesModule,
    CustomersModule,
    UsersModule,
  ],
  controllers: [FollowUpsController],
  providers: [FollowUpsService, FollowUpsRepository],
  exports: [TypeOrmModule],
})
export class FollowUpsModule {}
