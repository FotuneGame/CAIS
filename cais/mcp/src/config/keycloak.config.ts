import { registerAs } from '@nestjs/config';

export interface KeycloakConfig {
  disabled: boolean;
  issuers: string[];
  jwksUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}

export default registerAs('keycloak', (): KeycloakConfig => ({
  disabled: process.env.AUTH_DISABLED === 'true',
  issuers: (process.env.KEYCLOAK_ISSUERS || '').split(',').filter(Boolean),
  jwksUrl: process.env.KEYCLOAK_JWKS_URL || '',
  tokenUrl: process.env.KEYCLOAK_TOKEN_URL || '',
  clientId: process.env.KEYCLOAK_CLIENT_ID || '',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
}));
