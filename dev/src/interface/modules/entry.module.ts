import { UsersService } from 'src/domain/services/users.service';

import { Module } from '@nestjs/common';

import { EntryService } from '../../domain/services/entry.service';
import { EntryController } from '../controllers/entry.controller';
import { UsersModule } from './users.module';

@Module({
  controllers: [EntryController],
  providers: [EntryService],
})
export class EntryModule {}
