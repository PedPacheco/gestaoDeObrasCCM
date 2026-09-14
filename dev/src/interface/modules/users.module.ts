import { UsersService } from 'src/application/usecases/users.service';
import { USER_REPOSITORY } from 'src/domain/contracts/IUserRepository';
import { UserRepository } from 'src/infra/repositories/userRepository';

import { Module } from '@nestjs/common';

import { UsersController } from '../controllers/users.controller';

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
