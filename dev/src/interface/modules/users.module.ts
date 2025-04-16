import { UsersService } from 'src/domain/services/users.service';
import { Module } from '@nestjs/common';

import { UsersController } from '../controllers/users.controller';
import { UserRepository } from 'src/infra/repositories/userRepository';
import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/domain/repositories/IUserRepository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [UsersService, USER_REPOSITORY],
})
export class UsersModule {}
