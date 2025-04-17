import { Module } from '@nestjs/common';

import { EntryService } from '../../domain/services/entry.service';
import { EntryController } from '../controllers/entry.controller';
import { UsersModule } from './users.module';
import { ENTRY_REPOSITORY } from 'src/domain/repositories/IEntryRepository';
import { EntryRespository } from 'src/infra/repositories/entryRepository';

@Module({
  imports: [UsersModule],
  controllers: [EntryController],
  providers: [
    EntryService,
    { provide: ENTRY_REPOSITORY, useClass: EntryRespository },
  ],
})
export class EntryModule {}
