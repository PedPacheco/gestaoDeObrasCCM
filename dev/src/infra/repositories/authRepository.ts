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
    is_admin,
    nome,
    permissao_edicao,
    tipo_usuario,
    id_area,
    id_regional,
    id_turma,
    email,
  }: User): Promise<User> {
    const user = await this.prisma.novo_tabela_usuarios.create({
      data: {
        username,
        senha: senha,
        permissao_edicao,
        id_area,
        is_admin,
        id_regional,
        id_turma,
        email,
        nome,
        tipo_usuario,
      },
    });

    return new User(user);
  }
}
