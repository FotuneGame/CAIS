import { registerAs } from '@nestjs/config';
import { DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export interface SwaggerConfig {
  path: string;
}

export const swaggerOptions = (title: string) => {
  const config = new DocumentBuilder()
    .setTitle(title)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const customOptions: SwaggerCustomOptions = {
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none' },
    customSiteTitle: title,
  };
  return { config, customOptions };
};

export default registerAs('swagger', (): SwaggerConfig => ({
  path: process.env.SWAGGER_PATH || 'docs',
}));
