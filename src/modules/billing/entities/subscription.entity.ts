import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SUBSCRIPTION_STATUSES } from '../subscription-status';
import type { SubscriptionStatus } from '../subscription-status';

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

  // Referência a um customer id de um provider de pagamento futuro — nunca
  // preenchido no MVP (nenhum dado de pagamento é processado aqui).
  @Column({ type: 'varchar', nullable: true })
  providerCustomerId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  renewsAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
