import helmet from 'helmet';
import { join } from 'path';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

import { SocketIoAdapter } from './core/adapters/socketIo.adapter';
import { getAllowedOrigins } from './core/config/cors.config';
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

  app.useGlobalInterceptors(new LoggingInterceptor());

  // Mesma lista de origens para HTTP e WebSocket (CORS_ORIGINS).
  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });
  app.useWebSocketAdapter(new SocketIoAdapter(app));
  await app.listen(process.env.PORT, '0.0.0.0');
}
bootstrap();
