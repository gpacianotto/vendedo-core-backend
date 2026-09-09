import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { UsersModule } from '../users/users.module';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesRepository } from './opportunities.repository';
import { OpportunitiesService } from './opportunities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Opportunity]),
    CustomersModule,
    UsersModule,
  ],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService, OpportunitiesRepository],
  exports: [TypeOrmModule],
})
export class OpportunitiesModule {}
