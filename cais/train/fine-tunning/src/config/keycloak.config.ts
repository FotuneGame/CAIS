import { registerAs } from '@nestjs/config';

export interface KeycloakConfig {
  disabled: boolean;
  issuers: string[];
  jwksUrl: string;
  clientId: string;
}

export default registerAs('keycloak', (): KeycloakConfig => ({
  disabled: process.env.AUTH_DISABLED === 'true',
  issuers: (process.env.KEYCLOAK_ISSUERS || '').split(',').filter(Boolean),
  jwksUrl: process.env.KEYCLOAK_JWKS_URL || '',
  clientId: process.env.KEYCLOAK_CLIENT_ID || '',
}));
