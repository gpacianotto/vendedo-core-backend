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
import { ROLES } from '../../../common/tenant-context/tenant-context';
import type { Role } from '../../../common/tenant-context/tenant-context';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { USER_STATUSES } from '../user-status';
import type { UserStatus } from '../user-status';

@Entity('users')
@Index(['tenantId', 'status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Nullable: usuário pode ficar UNLINKED (sem estabelecimento) — seção 8.
  @Column({ type: 'uuid', nullable: true })
  tenantId: string | null;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant | null;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: ROLES })
  role: Role;

  @Column({ type: 'enum', enum: USER_STATUSES, default: 'ACTIVE' })
  status: UserStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;
}
