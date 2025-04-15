import { UsersService } from 'src/domain/services/users.service';
import { Module } from '@nestjs/common';

import { UsersController } from '../controllers/users.controller';
import { UserRepository } from 'src/infra/repositories/userRepository';
import { IUserRepository } from 'src/domain/repositories/IUserRepository';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
