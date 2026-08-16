import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Role } from '../../../common/tenant-context/tenant-context';
import { Session } from '../entities/session.entity';
import { AuthTokensResponse } from '../jwt-payload';
import { TokenService } from '../token.service';

export interface SessionSubject {
  id: string;
  tenantId: string | null;
  role: Role;
}

/**
 * Única fonte de criação/revogação de sessões — usada por AuthService
 * (register/login/refresh/logout) e por TenantsService (unlink revoga
 * sessões; criação de tenant revoga a sessão antiga e emite uma nova, já
 * que tenantId/role mudam). Extraída para cá porque TenantsModule não pode
 * importar AuthModule (AuthModule já importa TenantsModule).
 */
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly tokenService: TokenService,
  ) {}

  async issueTokens(
    user: SessionSubject,
    manager?: EntityManager,
  ): Promise<AuthTokensResponse> {
    const sessionRepository = manager
      ? manager.getRepository(Session)
      : this.sessionsRepository;

    const {
      token: refreshToken,
      tokenHash,
      expiresAt,
    } = this.tokenService.generateRefreshToken();

    const session = sessionRepository.create({
      userId: user.id,
      tenantId: user.tenantId,
      refreshTokenHash: tokenHash,
      expiresAt,
    });
    await sessionRepository.save(session);

    const { token: accessToken, expiresInSeconds } =
      this.tokenService.signAccessToken({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        sessionId: session.id,
      });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
    };
  }

  findByRefreshTokenHash(tokenHash: string): Promise<Session | null> {
    return this.sessionsRepository.findOne({
      where: { refreshTokenHash: tokenHash },
    });
  }

  findById(id: string): Promise<Session | null> {
    return this.sessionsRepository.findOne({ where: { id } });
  }

  async revoke(session: Session): Promise<void> {
    session.revokedAt = new Date();
    await this.sessionsRepository.save(session);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessionsRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
}
