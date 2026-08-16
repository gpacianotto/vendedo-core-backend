import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditAction } from './audit-action';
import { AuditLog } from './entities/audit-log.entity';

export interface RecordAuditEventParams {
  action: AuditAction;
  entity: string;
  entityId?: string;
  tenantId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Grava um evento de auditoria. Best-effort: uma falha aqui é logada, mas
   * nunca propagada — a operação de negócio que disparou o evento não deve
   * falhar por causa de um problema no audit log.
   *
   * Passe `manager` para gravar dentro da mesma transação da operação de
   * negócio (recomendado sempre que possível, para consistência).
   */
  async record(
    params: RecordAuditEventParams,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(AuditLog)
      : this.auditLogRepository;

    try {
      const entry = repository.create({
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        tenantId: params.tenantId ?? null,
        userId: params.userId ?? null,
        metadataJson: params.metadata ?? null,
      });
      await repository.save(entry);
    } catch (error) {
      this.logger.error(
        `Falha ao gravar audit log (action=${params.action}, entity=${params.entity})`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
