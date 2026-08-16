import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SUBSCRIPTION_STATUSES } from '../subscription-status';
import type { SubscriptionStatus } from '../subscription-status';

/**
 * Bootstrap mínimo (ver 02-identity-auth.md): só os campos necessários para
 * o registro checar limite de assentos. `provider_customer_id`/`renews_at`
 * e o restante do módulo de billing chegam em 10-billing.md.
 */
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ default: 'FREE' })
  plan: string;

  @Column({ type: 'enum', enum: SUBSCRIPTION_STATUSES, default: 'ACTIVE' })
  status: SubscriptionStatus;

  @Column({ type: 'int' })
  maxOwners: number;

  @Column({ type: 'int' })
  maxSellers: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
