import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { AppException } from '../../common/errors/app.exception';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { Customer } from '../customers/entities/customer.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';
import { User } from '../users/entities/user.entity';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { ListFollowUpsQueryDto } from './dto/list-follow-ups-query.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import { FollowUp } from './entities/follow-up.entity';
import { FollowUpsRepository } from './follow-ups.repository';

export interface FollowUpSummary {
  id: string;
  opportunityId: string | null;
  customerId: string | null;
  assignedTo: string;
  type: string;
  scheduledAt: Date;
  completedAt: Date | null;
  priority: FollowUp['priority'];
  status: FollowUp['status'];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedFollowUps {
  items: FollowUpSummary[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class FollowUpsService {
  constructor(
    private readonly followUpsRepository: FollowUpsRepository,
    @InjectRepository(Opportunity)
    private readonly opportunitiesRepository: Repository<Opportunity>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async create(dto: CreateFollowUpDto): Promise<FollowUpSummary> {
    const tenantId = this.tenantContextService.getTenantId();
    const assignedTo = dto.assignedTo ?? this.tenantContextService.getUserId();

    if (dto.opportunityId) {
      await this.assertOpportunityBelongsToTenant(dto.opportunityId, tenantId);
    }
    if (dto.customerId) {
      await this.assertCustomerBelongsToTenant(dto.customerId, tenantId);
    }
    await this.assertAssigneeBelongsToTenant(assignedTo, tenantId);

    const followUp = this.followUpsRepository.create({
      opportunityId: dto.opportunityId ?? null,
      customerId: dto.customerId ?? null,
      assignedTo,
      type: dto.type,
      scheduledAt: new Date(dto.scheduledAt),
      completedAt: null,
      priority: dto.priority ?? 'NORMAL',
      status: 'PENDING',
      note: dto.note ?? null,
    });
    const saved = await this.followUpsRepository.save(followUp);

    return this.toSummary(saved);
  }

  async list(query: ListFollowUpsQueryDto): Promise<PaginatedFollowUps> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<FollowUp> = {};
    if (query.assignedTo) where.assignedTo = query.assignedTo;
    if (query.status) where.status = query.status;

    if (query.overdue) {
      where.status = where.status ?? 'PENDING';
      where.scheduledAt = LessThan(new Date());
    } else if (query.today) {
      where.status = where.status ?? 'PENDING';
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      where.scheduledAt = Between(startOfDay, endOfDay);
    }

    const [items, total] = await this.followUpsRepository.findAndCount({
      where,
      order: { scheduledAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((followUp) => this.toSummary(followUp)),
      page,
      limit,
      total,
    };
  }

  async update(id: string, dto: UpdateFollowUpDto): Promise<FollowUpSummary> {
    const followUp = await this.findOrThrow(id);
    const tenantId = this.tenantContextService.getTenantId();

    if (dto.opportunityId !== undefined) {
      await this.assertOpportunityBelongsToTenant(dto.opportunityId, tenantId);
      followUp.opportunityId = dto.opportunityId;
    }
    if (dto.customerId !== undefined) {
      await this.assertCustomerBelongsToTenant(dto.customerId, tenantId);
      followUp.customerId = dto.customerId;
    }
    if (dto.assignedTo !== undefined) {
      await this.assertAssigneeBelongsToTenant(dto.assignedTo, tenantId);
      followUp.assignedTo = dto.assignedTo;
    }
    if (dto.type !== undefined) followUp.type = dto.type;
    if (dto.scheduledAt !== undefined) {
      followUp.scheduledAt = new Date(dto.scheduledAt);
    }
    if (dto.priority !== undefined) followUp.priority = dto.priority;
    if (dto.note !== undefined) followUp.note = dto.note;

    if (dto.status !== undefined) {
      // BE-FU-001: só PENDING -> COMPLETED|CANCELED; nunca reabrir por aqui.
      if (followUp.status !== 'PENDING') {
        throw new AppException({
          status: HttpStatus.CONFLICT,
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Só é possível concluir ou cancelar um follow-up pendente.',
        });
      }
      followUp.status = dto.status;
      followUp.completedAt = dto.status === 'COMPLETED' ? new Date() : null;
    }

    const saved = await this.followUpsRepository.save(followUp);

    return this.toSummary(saved);
  }

  private async findOrThrow(id: string): Promise<FollowUp> {
    const followUp = await this.followUpsRepository.findOne({ where: { id } });
    if (!followUp) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'FOLLOW_UP_NOT_FOUND',
        message: 'Follow-up não encontrado.',
      });
    }
    return followUp;
  }

  private async assertOpportunityBelongsToTenant(
    opportunityId: string,
    tenantId: string,
  ): Promise<void> {
    const opportunity = await this.opportunitiesRepository.findOne({
      where: { id: opportunityId, tenantId },
    });
    if (!opportunity) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'OPPORTUNITY_NOT_FOUND',
        message: 'Oportunidade não encontrada neste estabelecimento.',
      });
    }
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

  private async assertAssigneeBelongsToTenant(
    assignedTo: string,
    tenantId: string,
  ): Promise<void> {
    const assignee = await this.usersRepository.findOne({
      where: { id: assignedTo, tenantId },
    });
    if (!assignee) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'ASSIGNEE_NOT_FOUND',
        message: 'Vendedor não encontrado neste estabelecimento.',
      });
    }
  }

  private toSummary(followUp: FollowUp): FollowUpSummary {
    return {
      id: followUp.id,
      opportunityId: followUp.opportunityId,
      customerId: followUp.customerId,
      assignedTo: followUp.assignedTo,
      type: followUp.type,
      scheduledAt: followUp.scheduledAt,
      completedAt: followUp.completedAt,
      priority: followUp.priority,
      status: followUp.status,
      note: followUp.note,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    };
  }
}
