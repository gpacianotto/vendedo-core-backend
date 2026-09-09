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
import { Opportunity } from '../../opportunities/entities/opportunity.entity';
import { User } from '../../users/entities/user.entity';
import { FOLLOW_UP_PRIORITIES } from '../follow-up-priority';
import type { FollowUpPriority } from '../follow-up-priority';
import { FOLLOW_UP_STATUSES } from '../follow-up-status';
import type { FollowUpStatus } from '../follow-up-status';

@Entity('follow_ups')
@Index(['tenantId', 'assignedTo', 'status', 'scheduledAt'])
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  // Referência opcional/obrigatória conforme tipo (doc frontend seção 10) —
  // nenhuma das duas é NOT NULL, mas nada impede setar as duas.
  @Column({ type: 'uuid', nullable: true })
  opportunityId: string | null;

  @ManyToOne(() => Opportunity, { nullable: true })
  @JoinColumn({ name: 'opportunity_id' })
  opportunity?: Opportunity | null;

  @Column({ type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ type: 'uuid' })
  assignedTo: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee?: User;

  @Column()
  type: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'enum', enum: FOLLOW_UP_PRIORITIES, default: 'NORMAL' })
  priority: FollowUpPriority;

  @Column({ type: 'enum', enum: FOLLOW_UP_STATUSES, default: 'PENDING' })
  status: FollowUpStatus;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
