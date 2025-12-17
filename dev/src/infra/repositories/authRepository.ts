import { User } from 'src/domain/entities/user.entity';
import { IAuthRepository } from 'src/domain/repositories/IAuthRepository';

import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async register({
    username,
    senha,
    permissao,
    id_regional,
    id_turma,
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
        id_turma,
        email,
        nome_usuario,
        permissao_visualizacao,
      },
    });

    return new User(user);
  }
}
