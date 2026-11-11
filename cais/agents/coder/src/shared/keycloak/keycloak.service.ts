import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, JWTPayload, jwtVerify } from 'jose';
import { KeycloakConfig } from '../../config/keycloak.config';
import { Token } from './types/keycloak.types';

@Injectable()
export class KeycloakService {
  private readonly config: KeycloakConfig;
  private readonly jwks?: ReturnType<typeof createRemoteJWKSet>;
  private cached?: { value: string; expires: number };

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<KeycloakConfig>('keycloak');
    if (this.config.jwksUrl) {
      this.jwks = createRemoteJWKSet(new URL(this.config.jwksUrl));
    }
  }

  get disabled() {
    return this.config.disabled;
  }

  async verify(token: string): Promise<JWTPayload> {
    if (!this.jwks) throw new Error('Keycloak не настроен: KEYCLOAK_JWKS_URL');
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.config.issuers,
    });
    return payload;
  }

  localUser(): JWTPayload {
    return { sub: 'local', azp: this.config.clientId };
  }

  owner(user: JWTPayload, requested?: string) {
    const { clientId } = this.config;
    const service = Boolean(clientId) && user.azp === clientId;
    return service && requested ? requested : String(user.sub);
  }

  async serviceToken(): Promise<string | undefined> {
    const { tokenUrl, clientId, clientSecret } = this.config;
    if (!tokenUrl || !clientId) return undefined;
    if (this.cached && this.cached.expires > Date.now())
      return this.cached.value;
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!res.ok) throw new Error(`Keycloak: токен сервиса ${res.status}`);
    const token = (await res.json()) as Token;
    const expires = Date.now() + (token.expires_in - 30) * 1000;
    this.cached = { value: token.access_token, expires };
    return token.access_token;
  }
}
