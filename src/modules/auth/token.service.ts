import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hashOpaqueToken } from '../../common/utils/hash-opaque-token';
import { parseDurationMs } from '../../common/utils/parse-duration';
import { Role } from '../../common/tenant-context/tenant-context';
import { JwtPayload } from './jwt-payload';

export interface SignAccessTokenParams {
  userId: string;
  tenantId: string | null;
  role: Role;
  sessionId: string;
}

export interface GeneratedRefreshToken {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(params: SignAccessTokenParams): {
    token: string;
    expiresInSeconds: number;
  } {
    const payload: JwtPayload = {
      sub: params.userId,
      tenantId: params.tenantId,
      role: params.role,
      sid: params.sessionId,
    };
    const token = this.jwtService.sign(payload);
    const expiresInSeconds = Math.floor(
      parseDurationMs(
        this.configService.get<string>('JWT_ACCESS_EXPIRES_IN')!,
      ) / 1000,
    );
    return { token, expiresInSeconds };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }

  generateRefreshToken(): GeneratedRefreshToken {
    const token = randomBytes(48).toString('hex');
    const tokenHash = hashOpaqueToken(token);
    const expiresAt = new Date(
      Date.now() +
        parseDurationMs(
          this.configService.get<string>('JWT_REFRESH_EXPIRES_IN')!,
        ),
    );
    return { token, tokenHash, expiresAt };
  }

  hashRefreshToken(token: string): string {
    return hashOpaqueToken(token);
  }
}
