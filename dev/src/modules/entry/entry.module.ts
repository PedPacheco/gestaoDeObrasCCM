import { Module } from '@nestjs/common';
import { EntryController } from './entry.controller';
import { EntryService } from './entry.service';
import { UsersService } from '../users/users.service';

@Module({
  controllers: [EntryController],
  providers: [EntryService, UsersService],
})
export class EntryModule {}
