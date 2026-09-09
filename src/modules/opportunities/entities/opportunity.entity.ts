import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { OPPORTUNITY_STAGES } from '../opportunity-stage';
import type { OpportunityStage } from '../opportunity-stage';
import { OPPORTUNITY_STATUSES } from '../opportunity-status';
import type { OpportunityStatus } from '../opportunity-status';

@Entity('opportunities')
@Index(['tenantId', 'stage', 'dueAt'])
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  customerId: string;

  // Sem onDelete: clientes/vendedores nunca são hard-deletados (soft-delete
  // via status — seção 8), então a FK não precisa de SET NULL/CASCADE.
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ type: 'uuid' })
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'seller_id' })
  seller?: User;

  @Column()
  title: string;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({ type: 'enum', enum: OPPORTUNITY_STAGES })
  stage: OpportunityStage;

  @Column({ type: 'timestamp', nullable: true })
  dueAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Derivado do stage (ABERTA salvo GANHA/PERDIDA) — nunca aceito direto do
  // cliente, ver OpportunitiesService.
  @Column({ type: 'enum', enum: OPPORTUNITY_STATUSES })
  status: OpportunityStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
