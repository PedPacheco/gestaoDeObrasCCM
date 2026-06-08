import { IUserRepository } from 'src/domain/repositories/IUserRepository';
import { userInterface } from 'src/interface/types/userInterface';

import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { novo_tabela_usuarios } from '@prisma/client';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUser(username: string): Promise<novo_tabela_usuarios | null> {
    return await this.prisma.novo_tabela_usuarios.findFirst({
      where: { username },
    });
  }

  async updatePassword(
    numberId: number,
    newPassword: string,
  ): Promise<userInterface> {
    const user = await this.prisma.novo_tabela_usuarios.update({
      where: { id: numberId },
      data: { senha: newPassword },
    });

    return user;
  }
}
