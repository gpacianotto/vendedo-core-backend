import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { TenantScopedRepository } from '../../common/tenant-context/tenant-scoped.repository';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersRepository extends TenantScopedRepository<Customer> {
  constructor(
    @InjectRepository(Customer) repository: Repository<Customer>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }
}
