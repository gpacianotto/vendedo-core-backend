import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, LessThanOrEqual, Repository } from 'typeorm';
import { AppException } from '../../common/errors/app.exception';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunitiesRepository } from './opportunities.repository';
import { isClosedStage } from './opportunity-stage';
import type { OpportunityStage } from './opportunity-stage';

export interface OpportunitySummary {
  id: string;
  customerId: string;
  sellerId: string;
  title: string;
  amount: number;
  stage: Opportunity['stage'];
  status: Opportunity['status'];
  dueAt: Date | null;
  source: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedOpportunities {
  items: OpportunitySummary[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly opportunitiesRepository: OpportunitiesRepository,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async create(dto: CreateOpportunityDto): Promise<OpportunitySummary> {
    const tenantId = this.tenantContextService.getTenantId();
    const sellerId = dto.sellerId ?? this.tenantContextService.getUserId();

    await this.assertCustomerBelongsToTenant(dto.customerId, tenantId);
    await this.assertSellerBelongsToTenant(sellerId, tenantId);

    const stage: OpportunityStage = dto.stage ?? 'NOVA';

    const opportunity = this.opportunitiesRepository.create({
      customerId: dto.customerId,
      sellerId,
      title: dto.title,
      amount: dto.amount,
      stage,
      status: isClosedStage(stage) ? 'FECHADA' : 'ABERTA',
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      source: dto.source ?? null,
      notes: dto.notes ?? null,
    });
    const saved = await this.opportunitiesRepository.save(opportunity);

    return this.toSummary(saved);
  }

  async list(
    query: ListOpportunitiesQueryDto,
  ): Promise<PaginatedOpportunities> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<Opportunity> = {};
    if (query.sellerId) where.sellerId = query.sellerId;
    if (query.stage) where.stage = query.stage;
    if (query.dueBefore)
      where.dueAt = LessThanOrEqual(new Date(query.dueBefore));

    const [items, total] = await this.opportunitiesRepository.findAndCount({
      where,
      order: { dueAt: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((opportunity) => this.toSummary(opportunity)),
      page,
      limit,
      total,
    };
  }

  async getById(id: string): Promise<OpportunitySummary> {
    const opportunity = await this.findOrThrow(id);
    return this.toSummary(opportunity);
  }

  async update(
    id: string,
    dto: UpdateOpportunityDto,
  ): Promise<OpportunitySummary> {
    const opportunity = await this.findOrThrow(id);
    const tenantId = this.tenantContextService.getTenantId();

    if (dto.customerId !== undefined) {
      await this.assertCustomerBelongsToTenant(dto.customerId, tenantId);
      opportunity.customerId = dto.customerId;
    }
    if (dto.sellerId !== undefined) {
      await this.assertSellerBelongsToTenant(dto.sellerId, tenantId);
      opportunity.sellerId = dto.sellerId;
    }
    if (dto.title !== undefined) opportunity.title = dto.title;
    if (dto.amount !== undefined) opportunity.amount = dto.amount;
    if (dto.dueAt !== undefined) opportunity.dueAt = new Date(dto.dueAt);
    if (dto.source !== undefined) opportunity.source = dto.source;
    if (dto.notes !== undefined) opportunity.notes = dto.notes;
    if (dto.stage !== undefined) {
      opportunity.stage = dto.stage;
      opportunity.status = isClosedStage(dto.stage) ? 'FECHADA' : 'ABERTA';
    }

    const saved = await this.opportunitiesRepository.save(opportunity);

    return this.toSummary(saved);
  }

  private async findOrThrow(id: string): Promise<Opportunity> {
    const opportunity = await this.opportunitiesRepository.findOne({
      where: { id },
    });
    if (!opportunity) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'OPPORTUNITY_NOT_FOUND',
        message: 'Oportunidade não encontrada.',
      });
    }
    return opportunity;
  }

  private async assertCustomerBelongsToTenant(
    customerId: string,
    tenantId: string,
  ): Promise<void> {
    const customer = await this.customersRepository.findOne({
      where: { id: customerId, tenantId },
    });
    if (!customer) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'CUSTOMER_NOT_FOUND',
        message: 'Cliente não encontrado neste estabelecimento.',
      });
    }
  }

  private async assertSellerBelongsToTenant(
    sellerId: string,
    tenantId: string,
  ): Promise<void> {
    const seller = await this.usersRepository.findOne({
      where: { id: sellerId, tenantId },
    });
    if (!seller) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'SELLER_NOT_FOUND',
        message: 'Vendedor não encontrado neste estabelecimento.',
      });
    }
  }

  private toSummary(opportunity: Opportunity): OpportunitySummary {
    return {
      id: opportunity.id,
      customerId: opportunity.customerId,
      sellerId: opportunity.sellerId,
      title: opportunity.title,
      amount: opportunity.amount,
      stage: opportunity.stage,
      status: opportunity.status,
      dueAt: opportunity.dueAt,
      source: opportunity.source,
      notes: opportunity.notes,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
    };
  }
}
