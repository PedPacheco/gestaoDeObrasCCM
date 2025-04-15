import { User } from 'src/domain/entities/user.entity';
import { IUserRepository } from 'src/domain/repositories/IUserRepository';
import { userInterface } from 'src/interface/types/userInterface';

import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  async findUser(username: string): Promise<User | null> {
    return await this.prisma.usuario.findFirst({
      where: { username },
    });
  }

  async updatePassword(
    numberId: number,
    newPassword: string,
  ): Promise<userInterface> {
    const user = await this.prisma.usuario.update({
      where: { id: numberId },
      data: { senha: newPassword },
      select: {
        id: true,
        username: true,
        senha: true,
      },
    });

    return user;
  }
}
