import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    NestCacheModule.register({
      ttl: 3600, // Tempo de vida em segundos
      max: 100, // Máximo de itens no cache
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
