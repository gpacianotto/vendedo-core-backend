import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { TenantContextService } from './tenant-context.service';

interface TenantOwnedEntity {
  tenantId: string;
}

/**
 * Base para repositories de entidades tenant-scoped. Toda leitura/escrita
 * passa por aqui e injeta `tenantId` a partir do TenantContext — nunca de
 * parâmetro externo. Módulos de domínio (customers, opportunities, etc.)
 * devem estender esta classe em vez de injetar `Repository<T>` diretamente,
 * para que seja estruturalmente difícil esquecer o filtro de tenant.
 */
export abstract class TenantScopedRepository<T extends TenantOwnedEntity> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly tenantContext: TenantContextService,
  ) {}

  protected get tenantId(): string {
    return this.tenantContext.getTenantId();
  }

  private withTenant(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[] = {},
  ): FindOptionsWhere<T>[] {
    const clauses = Array.isArray(where) ? where : [where];
    return clauses.map((clause) => ({ ...clause, tenantId: this.tenantId }));
  }

  find(options: FindManyOptions<T> = {}): Promise<T[]> {
    return this.repository.find({
      ...options,
      where: this.withTenant(options.where),
    });
  }

  findAndCount(options: FindManyOptions<T> = {}): Promise<[T[], number]> {
    return this.repository.findAndCount({
      ...options,
      where: this.withTenant(options.where),
    });
  }

  findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      ...options,
      where: this.withTenant(options.where),
    });
  }

  count(options: FindManyOptions<T> = {}): Promise<number> {
    return this.repository.count({
      ...options,
      where: this.withTenant(options.where),
    });
  }

  create(entityLike: DeepPartial<T>): T {
    return this.repository.create({
      ...entityLike,
      tenantId: this.tenantId,
    } as DeepPartial<T>);
  }

  // Muta `entity` em vez de espalhar uma cópia: `repository.save()` só
  // popula campos gerados (id, updatedAt) de volta na própria referência
  // passada — espalhar quebraria isso silenciosamente para quem chama
  // save(entity) e depois lê entity.id, seguindo o padrão do resto do
  // código (ex.: AuthService.register()).
  save(entity: DeepPartial<T>): Promise<T> {
    (entity as Partial<TenantOwnedEntity>).tenantId = this.tenantId;
    return this.repository.save(entity as T);
  }
}
