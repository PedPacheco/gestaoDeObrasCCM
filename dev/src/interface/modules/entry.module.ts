import { Module } from '@nestjs/common';

import { EntryService } from '../../domain/services/entry.service';
import { EntryController } from '../controllers/entry.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule],
  controllers: [EntryController],
  providers: [EntryService],
})
export class EntryModule {}
