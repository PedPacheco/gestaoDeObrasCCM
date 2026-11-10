import helmet from 'helmet';
import { extname, join } from 'path';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

import { ServeStaticOptions } from '@nestjs/platform-express/interfaces/serve-static-options.interface.js';
import { SocketIoAdapter } from './core/adapters/socketIo.adapter';
import { getAllowedOrigins } from './core/config/cors.config';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';

const INLINE_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

function staticOptions(prefix: string): ServeStaticOptions {
  return {
    prefix,
    index: false,
    dotfiles: 'deny',
    setHeaders: (res, filePath) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (!INLINE_EXTENSIONS.has(extname(filePath).toLowerCase())) {
        res.setHeader('Content-Dispostion', 'attachment');
      }
    },
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.use(helmet());

  app.useBodyParser('json', { limit: '5mb' });
  app.useBodyParser('urlencoded', { limit: '5mb', extended: true });

  app.useStaticAssets(
    join(process.env.UPLOAD_DEST!),
    staticOptions('/uploads/viabilidade'),
  );

  // 📂 As Build
  app.useStaticAssets(
    join(process.env.UPLOAD_AS_BUILD!),
    staticOptions('/uploads/as_build'),
  );

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
