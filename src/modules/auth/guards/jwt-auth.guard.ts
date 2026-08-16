import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IS_PUBLIC_KEY } from '../../../common/auth/public.decorator';
import { AuthenticatedRequest } from '../../../common/auth/authenticated-request';
import { Session } from '../entities/session.entity';
import { TokenService } from '../token.service';

/**
 * Guard real de autenticação (ausente no ms-auth-saas). Além de validar
 * assinatura/expiração do JWT, confere que a sessão referenciada (`sid`)
 * ainda não foi revogada — é isso que permite invalidar um access token
 * imediatamente ao fazer logout, mesmo antes do `exp` do token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    const payload = await this.tokenService
      .verifyAccessToken(token)
      .catch(() => {
        throw new UnauthorizedException('Token inválido ou expirado.');
      });

    const session = await this.sessionRepository.findOne({
      where: { id: payload.sid },
    });
    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Sessão revogada.');
    }

    request.authContext = {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
    };

    return true;
  }
}

function extractBearerToken(authorizationHeader?: string): string | undefined {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return undefined;
  }
  return authorizationHeader.slice('Bearer '.length).trim() || undefined;
}
