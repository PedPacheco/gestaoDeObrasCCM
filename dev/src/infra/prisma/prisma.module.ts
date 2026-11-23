import { Global, Module } from '@nestjs/common';
import { DbSchema } from './dbSchema.provider';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, DbSchema],
  exports: [PrismaService, DbSchema],
})
export class PrismaModule {}
