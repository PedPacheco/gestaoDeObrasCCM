import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import * as bodyParser from 'body-parser';

const rootUrl = process.env.ROOT_URL || 'localhost';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: `http://${rootUrl}:3000`,
    credentials: true,
  });
  await app.listen(8080, '0.0.0.0');
}
bootstrap();
