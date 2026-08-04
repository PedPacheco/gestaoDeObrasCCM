import helmet from 'helmet';
import { join } from 'path';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.use(helmet());

  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { limit: '5mb', extended: true });

  app.useStaticAssets(join(process.env.UPLOAD_DEST!), {
    prefix: '/uploads/viabilidade',
  });

  // 📂 As Build
  app.useStaticAssets(join(process.env.UPLOAD_AS_BUILD!), {
    prefix: '/uploads/as_build',
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const corsOrigins =
    process.env.CORS_ORIGINS?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  await app.listen(8080);
}
bootstrap();
