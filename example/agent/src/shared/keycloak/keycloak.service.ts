import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, JWTPayload, jwtVerify } from 'jose';
import { KeycloakConfig } from '../../config/keycloak.config';

@Injectable()
export class KeycloakService {
  private readonly config: KeycloakConfig;
  private readonly jwks?: ReturnType<typeof createRemoteJWKSet>;

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
}
