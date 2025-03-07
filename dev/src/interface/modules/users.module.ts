import { UsersService } from 'src/domain/services/users.service';

import { Module } from '@nestjs/common';

import { UsersController } from '../controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
