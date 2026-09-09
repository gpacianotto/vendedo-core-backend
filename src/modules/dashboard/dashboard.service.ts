import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThan, Repository } from 'typeorm';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { Customer } from '../customers/entities/customer.entity';
import { FollowUp } from '../follow-ups/entities/follow-up.entity';
import { Opportunity } from '../opportunities/entities/opportunity.entity';

const ATTENTION_NEEDED_LIMIT = 10;
const AWAITING_RESPONSE_LIMIT = 10;
// "sem atualização há X dias" — valor fixo no MVP (seção 27 do doc conceitual
// usa 3 dias como exemplo); vira configurável em versão futura.
const AWAITING_RESPONSE_STALE_DAYS = 3;

interface CustomerNameRow {
  customerName: string | null;
}

function extractCustomerName(raw: unknown[], index: number): string | null {
  return (raw[index] as CustomerNameRow | undefined)?.customerName ?? null;
}

export interface AttentionNeededItem {
  followUpId: string;
  type: string;
  scheduledAt: Date;
  priority: FollowUp['priority'];
  overdue: boolean;
  customerId: string | null;
  customerName: string | null;
  opportunityId: string | null;
}

export interface AwaitingResponseItem {
  opportunityId: string;
  title: string;
  amount: number;
  customerId: string;
  customerName: string | null;
  dueAt: Date | null;
  daysSinceUpdate: number;
}

export interface DashboardSummary {
  today: {
    overdueFollowUps: number;
    followUpsToday: number;
    openOpportunities: number;
  };
  attentionNeeded: AttentionNeededItem[];
  awaitingResponse: AwaitingResponseItem[];
  // Sempre vazio no MVP — gap conhecido documentado em 08-dashboard.md
  // (depende de janela de "sem contato" configurável, evolução V2).
  stalledCustomers: [];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(FollowUp)
    private readonly followUpsRepository: Repository<FollowUp>,
    @InjectRepository(Opportunity)
    private readonly opportunitiesRepository: Repository<Opportunity>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const tenantId = this.tenantContextService.getTenantId();
    const userId = this.tenantContextService.getUserId();
    // OWNER vê o panorama completo do tenant; SELLER vê só o que é dele
    // (decisão assumida explicitamente em 08-dashboard.md, já que o
    // documento de requisitos não especifica o escopo do OWNER).
    const scopeToSeller = this.tenantContextService.getRole() === 'SELLER';

    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const staleThreshold = new Date(
      now.getTime() - AWAITING_RESPONSE_STALE_DAYS * 24 * 60 * 60 * 1000,
    );

    const [
      overdueFollowUps,
      followUpsToday,
      openOpportunities,
      attentionNeeded,
      awaitingResponse,
    ] = await Promise.all([
      this.followUpsRepository.count({
        where: {
          tenantId,
          status: 'PENDING',
          scheduledAt: LessThan(now),
          ...(scopeToSeller ? { assignedTo: userId } : {}),
        },
      }),
      this.followUpsRepository.count({
        where: {
          tenantId,
          status: 'PENDING',
          scheduledAt: Between(startOfDay, endOfDay),
          ...(scopeToSeller ? { assignedTo: userId } : {}),
        },
      }),
      this.opportunitiesRepository.count({
        where: {
          tenantId,
          status: 'ABERTA',
          ...(scopeToSeller ? { sellerId: userId } : {}),
        },
      }),
      this.getAttentionNeeded(tenantId, scopeToSeller ? userId : null, now),
      this.getAwaitingResponse(
        tenantId,
        scopeToSeller ? userId : null,
        staleThreshold,
        now,
      ),
    ]);

    return {
      today: {
        overdueFollowUps,
        followUpsToday,
        openOpportunities,
      },
      attentionNeeded,
      awaitingResponse,
      stalledCustomers: [],
    };
  }

  private async getAttentionNeeded(
    tenantId: string,
    sellerId: string | null,
    now: Date,
  ): Promise<AttentionNeededItem[]> {
    const qb = this.followUpsRepository
      .createQueryBuilder('fu')
      .leftJoin(Customer, 'c', 'c.id = fu.customer_id')
      .addSelect('c.name', 'customerName')
      .where('fu.tenant_id = :tenantId', { tenantId })
      .andWhere('fu.status = :status', { status: 'PENDING' })
      .andWhere('(fu.priority = :high OR fu.scheduled_at < :now)', {
        high: 'HIGH',
        now,
      })
      .orderBy('fu.scheduled_at', 'ASC')
      .limit(ATTENTION_NEEDED_LIMIT);

    if (sellerId) {
      qb.andWhere('fu.assigned_to = :sellerId', { sellerId });
    }

    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((followUp, index) => ({
      followUpId: followUp.id,
      type: followUp.type,
      scheduledAt: followUp.scheduledAt,
      priority: followUp.priority,
      overdue: followUp.scheduledAt < now,
      customerId: followUp.customerId,
      customerName: extractCustomerName(raw, index),
      opportunityId: followUp.opportunityId,
    }));
  }

  private async getAwaitingResponse(
    tenantId: string,
    sellerId: string | null,
    staleThreshold: Date,
    now: Date,
  ): Promise<AwaitingResponseItem[]> {
    const qb = this.opportunitiesRepository
      .createQueryBuilder('opp')
      .leftJoin(Customer, 'c', 'c.id = opp.customer_id')
      .addSelect('c.name', 'customerName')
      .where('opp.tenant_id = :tenantId', { tenantId })
      .andWhere('opp.stage = :stage', { stage: 'ORCAMENTO_ENVIADO' })
      .andWhere('opp.updated_at <= :staleThreshold', { staleThreshold })
      .orderBy('opp.updated_at', 'ASC')
      .limit(AWAITING_RESPONSE_LIMIT);

    if (sellerId) {
      qb.andWhere('opp.seller_id = :sellerId', { sellerId });
    }

    const { entities, raw } = await qb.getRawAndEntities();

    return entities.map((opportunity, index) => ({
      opportunityId: opportunity.id,
      title: opportunity.title,
      amount: opportunity.amount,
      customerId: opportunity.customerId,
      customerName: extractCustomerName(raw, index),
      dueAt: opportunity.dueAt,
      daysSinceUpdate: Math.floor(
        (now.getTime() - opportunity.updatedAt.getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    }));
  }
}
