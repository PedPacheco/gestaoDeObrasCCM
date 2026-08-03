// src/core/logger/logger.module.ts

import { Global, Module } from '@nestjs/common';
import { AppLogger } from 'src/core/logger/logger.service';

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
