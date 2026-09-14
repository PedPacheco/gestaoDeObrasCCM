import { IUserRepository } from 'src/domain/contracts/IUserRepository';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { userReponse } from '../../domain/types/index';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUser(username: string): Promise<userReponse | null> {
    return await this.prisma.novo_tabela_usuarios.findFirst({
      where: { username },
    });
  }

  async updatePassword(
    numberId: number,
    newPassword: string,
  ): Promise<userReponse> {
    const user = await this.prisma.novo_tabela_usuarios.update({
      where: { id: numberId },
      data: { senha: newPassword },
    });

    return user;
  }
}
