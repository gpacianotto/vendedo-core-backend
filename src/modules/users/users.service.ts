import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Not, Repository } from 'typeorm';
import { AppException } from '../../common/errors/app.exception';
import { TenantContextService } from '../../common/tenant-context/tenant-context.service';
import { AuditAction } from '../audit/audit-action';
import { AuditService } from '../audit/audit.service';
import { SessionsService } from '../auth/sessions/sessions.service';
import { ListTeamQueryDto } from './dto/list-team-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { User } from './entities/user.entity';

const BCRYPT_COST = 10;

export interface ProfileSummary {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  status: User['status'];
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  email: string;
  role: User['role'];
  status: User['status'];
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface PaginatedTeam {
  items: TeamMemberSummary[];
  page: number;
  limit: number;
  total: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly tenantContextService: TenantContextService,
    private readonly auditService: AuditService,
    private readonly sessionsService: SessionsService,
  ) {}

  async updateProfile(dto: UpdateProfileDto): Promise<ProfileSummary> {
    const userId = this.tenantContextService.getUserId();
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
    }

    if (dto.newPassword) {
      const currentPasswordMatches = await bcrypt.compare(
        dto.currentPassword as string,
        user.passwordHash,
      );
      if (!currentPasswordMatches) {
        throw new AppException({
          status: HttpStatus.UNAUTHORIZED,
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'Senha atual incorreta.',
        });
      }
      user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_COST);
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    await this.usersRepository.save(user);

    return this.toProfileSummary(user);
  }

  async listTeam(query: ListTeamQueryDto): Promise<PaginatedTeam> {
    const tenantId = this.tenantContextService.getTenantId();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.usersRepository.findAndCount({
      where: { tenantId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((user) => this.toTeamMemberSummary(user)),
      page,
      limit,
      total,
    };
  }

  async updateTeamMember(
    targetId: string,
    dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberSummary> {
    if (dto.role === undefined && dto.status === undefined) {
      throw new AppException({
        status: HttpStatus.BAD_REQUEST,
        code: 'NO_FIELDS_TO_UPDATE',
        message: 'Informe role e/ou status para atualizar.',
      });
    }

    const tenantId = this.tenantContextService.getTenantId();
    const ownerId = this.tenantContextService.getUserId();

    const target = await this.usersRepository.findOne({
      where: { id: targetId, tenantId },
    });
    if (!target) {
      throw new AppException({
        status: HttpStatus.NOT_FOUND,
        code: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado neste estabelecimento.',
      });
    }

    const nextRole = dto.role ?? target.role;
    const nextStatus = dto.status ?? target.status;

    // Proteção mínima (04-users.md): nunca deixar o tenant sem nenhum OWNER
    // ativo — nem por troca de role, nem por desativação.
    const losesOwnerCoverage =
      target.role === 'OWNER' &&
      target.status === 'ACTIVE' &&
      (nextRole !== 'OWNER' || nextStatus !== 'ACTIVE');

    if (losesOwnerCoverage) {
      const otherActiveOwners = await this.usersRepository.count({
        where: {
          tenantId,
          role: 'OWNER',
          status: 'ACTIVE',
          id: Not(target.id),
        },
      });
      if (otherActiveOwners === 0) {
        throw new AppException({
          status: HttpStatus.CONFLICT,
          code: 'LAST_OWNER_PROTECTION',
          message:
            'O estabelecimento precisa de pelo menos um OWNER ativo. Promova outro usuário antes de alterar este.',
        });
      }
    }

    const changed = nextRole !== target.role || nextStatus !== target.status;

    target.role = nextRole;
    target.status = nextStatus;
    await this.usersRepository.save(target);

    if (changed) {
      // Revoga sessões ativas do alvo: claims de role/status ficam obsoletas
      // no access token já emitido (mesmo raciocínio de unlinkUserById em
      // TenantsService) — força reautenticação para pegar os claims novos.
      await this.sessionsService.revokeAllForUser(target.id);

      await this.auditService.record({
        action: AuditAction.USER_TEAM_MEMBER_UPDATED,
        entity: 'user',
        entityId: target.id,
        tenantId,
        userId: ownerId,
        metadata: { role: nextRole, status: nextStatus },
      });
    }

    return this.toTeamMemberSummary(target);
  }

  private toProfileSummary(user: User): ProfileSummary {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  private toTeamMemberSummary(user: User): TeamMemberSummary {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
