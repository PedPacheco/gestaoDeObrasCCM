import { User } from 'src/domain/entities/user.entity';
import { IAuthRepository } from 'src/domain/contracts/IAuthRepository';

import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: User): Promise<User> {
    const {
      email,
      id_regional,
      id_turma,
      id_area,
      is_admin,
      nome,
      permissao_edicao,
      senha,
      tipo_usuario,
      username,
    } = data;
    const { id } = await this.prisma.novo_tabela_usuarios.create({
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

    return new User({ id, ...data });
  }
}
