import { ConsoleLogger, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new ConsoleLogger({ json: isProduction }),
  });
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  // Real client IPs for rate limiting when running behind the Next.js rewrite / a reverse proxy.
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));
  app.setGlobalPrefix('api');
  // Swagger UI needs inline scripts, so the CSP is only enforced in production where docs are off.
  app.use(helmet({ contentSecurityPolicy: isProduction ? undefined : false }));
  app.use(cookieParser());
  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }), credentials: true });
  app.enableShutdownHooks();

  if (!isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Safari Beauty Salon API')
        .setVersion('1.0')
        .addCookieAuth('sbs_at')
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API ready on http://localhost:${port}/api`, 'Bootstrap');
}

await bootstrap();
