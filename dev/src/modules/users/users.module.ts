import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { UsersController } from './users.controller';

@Module({
  controllers: [UsersController],
  exports: [UsersService],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
