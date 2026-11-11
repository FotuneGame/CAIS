import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { JWTPayload } from 'jose';
import { KeycloakService } from '../../shared/keycloak/keycloak.service';

export type AuthRequest = Request & { user: JWTPayload };

export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly keycloakService: KeycloakService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (this.keycloakService.disabled) {
      request.user = this.keycloakService.localUser();
      return true;
    }
    const open = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (open) return true;
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    try {
      if (type !== 'Bearer' || !token) throw new Error('нет токена');
      request.user = await this.keycloakService.verify(token);
      return true;
    } catch {
      const publicUrl = this.configService.get<string>('app.publicUrl', '');
      const metadata = `${publicUrl}/.well-known/oauth-protected-resource`;
      context
        .switchToHttp()
        .getResponse<Response>()
        .setHeader(
          'WWW-Authenticate',
          `Bearer resource_metadata="${metadata}"`,
        );
      throw new UnauthorizedException('Нужен действующий токен Keycloak');
    }
  }
}
