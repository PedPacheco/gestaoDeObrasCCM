import { Module } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { EntryController } from './entry.controller';
import { EntryService } from './entry.service';

@Module({
  controllers: [EntryController],
  providers: [EntryService, PrismaService],
})
export class EntryModule {}
