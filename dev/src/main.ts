import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import * as bodyParser from 'body-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

const rootUrl = process.env.ROOT_URL || 'localhost';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

  app.useStaticAssets(join(process.env.UPLOAD_DEST!), {
    prefix: '/uploads/viabilidade',
  });

  // 📂 As Build
  app.useStaticAssets(join(process.env.UPLOAD_AS_BUILD!), {
    prefix: '/uploads/as_build',
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.enableCors({
    origin: `http://${rootUrl}:3000`,
    credentials: true,
  });
  await app.listen(8080, '0.0.0.0');
}
bootstrap();
