import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { TenantScopedRepository } from '../../common/tenant-context/tenant-scoped.repository';
import { Opportunity } from './entities/opportunity.entity';

@Injectable()
export class OpportunitiesRepository extends TenantScopedRepository<Opportunity> {
  constructor(
    @InjectRepository(Opportunity) repository: Repository<Opportunity>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }
}
