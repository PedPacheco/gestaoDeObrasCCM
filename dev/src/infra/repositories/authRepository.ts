import { User } from 'src/domain/entities/user.entity';
import { IAuthRepository } from 'src/domain/repositories/IAuthRepository';

import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private prisma: PrismaService) {}

  async register({
    username,
    senha,
    permissao,
    id_regional,
    email,
    nome_usuario,
    permissao_visualizacao,
  }: User): Promise<User> {
    const user = await this.prisma.usuario.create({
      data: {
        username,
        senha: senha,
        permissao,
        id_regional,
        email,
        nome_usuario,
        permissao_visualizacao,
      },
    });

    return user;
  }

  sendEmailResetPassword(username: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
