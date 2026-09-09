import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { AppException } from '../../common/errors/app.exception';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { TenantConfig } from '../tenants/schemas/tenant-config.schema';
import { User } from '../users/entities/user.entity';
import { Subscription } from './entities/subscription.entity';

export interface SubscriptionSummary {
  plan: string;
  status: Subscription['status'];
  seats: {
    owners: { max: number; used: number };
    sellers: { max: number; used: number };
  };
  billing: {
    pricingModel: string;
    pricePerSeat: number | null;
    currency: string;
  };
  renewsAt: Date | null;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectModel(TenantConfig.name)
    private readonly tenantConfigModel: Model<TenantConfig>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async getCurrent(): Promise<SubscriptionSummary> {
    const tenantId = this.tenantContextService.getTenantId();

    const [subscription, activeOwners, activeSellers, config] =
      await Promise.all([
        this.subscriptionsRepository.findOne({ where: { tenantId } }),
        this.usersRepository.count({
          where: { tenantId, role: 'OWNER', status: 'ACTIVE' },
        }),
        this.usersRepository.count({
          where: { tenantId, role: 'SELLER', status: 'ACTIVE' },
        }),
        this.tenantConfigModel.findOne({ tenantId }),
      ]);

    if (!subscription) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'SUBSCRIPTION_NOT_FOUND',
        message: 'Assinatura não encontrada para este estabelecimento.',
      });
    }
    if (!config) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'TENANT_CONFIG_NOT_FOUND',
        message: 'Configuração do tenant não encontrada.',
      });
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      seats: {
        owners: { max: subscription.maxOwners, used: activeOwners },
        sellers: { max: subscription.maxSellers, used: activeSellers },
      },
      billing: {
        pricingModel: config.billing.pricingModel,
        pricePerSeat: config.billing.pricePerSeat,
        currency: config.billing.currency,
      },
      renewsAt: subscription.renewsAt,
    };
  }
}
