import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { TenantScopedRepository } from '../../common/tenant-context/tenant-scoped.repository';
import { FollowUp } from './entities/follow-up.entity';

@Injectable()
export class FollowUpsRepository extends TenantScopedRepository<FollowUp> {
  constructor(
    @InjectRepository(FollowUp) repository: Repository<FollowUp>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }
}
