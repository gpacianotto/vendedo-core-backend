import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TENANT_STATUSES } from '../tenant-status';
import type { TenantStatus } from '../tenant-status';

/**
 * Identidade relacional mínima do tenant (id/código/status), para
 * integridade referencial com `users.tenant_id`. Configuração rica
 * (branding, features, joinPolicy, billing comercial) fica no MongoDB
 * `tenant_configs` — implementado em 03-tenants.md.
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tenantCode: string;

  @Column({ type: 'enum', enum: TENANT_STATUSES, default: 'ACTIVE' })
  status: TenantStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
