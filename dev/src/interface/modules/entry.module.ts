import { UsersService } from 'src/domain/services/users.service';

import { Module } from '@nestjs/common';

import { EntryService } from '../../domain/services/entry.service';
import { EntryController } from '../controllers/entry.controller';

@Module({
  controllers: [EntryController],
  providers: [EntryService, UsersService],
})
export class EntryModule {}
