import { User } from 'src/domain/entities/user.entity';
import { IUserRepository } from 'src/domain/repositories/IUserRepository';
// import { userInterface } from 'src/interface/types/userInterface';

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

  async updatePassword(numberId: number, newPassword: string): Promise<any> {
    const user = await this.prisma.novo_tabela_usuarios.update({
      where: { id: numberId },
      data: { senha: newPassword },
    });

    return user;
  }

  async findAll(): Promise<any[]> {
    return await this.prisma.novo_tabela_usuarios.findMany({
      select: {
        id: true,
        id_regional: true,
        id_turma: true,
        id_area: true,
        email: true,
        nome: true,
        permissao_edicao: true,
        tipo_usuario: true,
        username: true,
        ativo: true,
        is_admin: true,
        regionais: { select: { regional: true } },
        turmas: { select: { turma: true } },
        areas: { select: { nome: true } },
      },
    });
  }

  async findByIdRaw(id: number): Promise<novo_tabela_usuarios | null> {
    return await this.prisma.novo_tabela_usuarios.findUnique({
      where: { id },
    });
  }

  async create(data: User): Promise<novo_tabela_usuarios> {
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

    return await this.prisma.novo_tabela_usuarios.create({
      data: {
        username,
        senha,
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
  }

  async softDelete(id: number): Promise<novo_tabela_usuarios> {
    return await this.prisma.novo_tabela_usuarios.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async reactivate(id: number): Promise<novo_tabela_usuarios> {
    return await this.prisma.novo_tabela_usuarios.update({
      where: { id },
      data: { ativo: true },
    });
  }

  async updatePermissaoEdicao(
    id: number,
    permissao_edicao: boolean,
  ): Promise<novo_tabela_usuarios> {
    return await this.prisma.novo_tabela_usuarios.update({
      where: { id },
      data: { permissao_edicao },
    });
  }
}
