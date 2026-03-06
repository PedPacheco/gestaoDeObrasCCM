import { EntryService } from 'src/application/services/entry.service';
import { ENTRY_REPOSITORY } from 'src/domain/repositories/IEntryRepository';
import { EntryRespository } from 'src/infra/repositories/entryRepository';

import { Module } from '@nestjs/common';

import { EntryController } from '../controllers/entry.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule],
  controllers: [EntryController],
  providers: [
    EntryService,
    { provide: ENTRY_REPOSITORY, useClass: EntryRespository },
  ],
})
export class EntryModule {}
