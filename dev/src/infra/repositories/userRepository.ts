import { User } from 'src/domain/entities/user.entity';
import {
  IUserRepository,
  UserStatusUpdate,
  UserWithRelations,
} from 'src/domain/repositories/IUserRepository';

import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { novo_tabela_usuarios } from '@prisma/client';

const userRelationsInclude = {
  regionais: { select: { regional: true } },
  turmas: { select: { turma: true } },
  areas: { select: { nome: true } },
};

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

  async findAll(): Promise<UserWithRelations[]> {
    return await this.prisma.novo_tabela_usuarios.findMany({
      where: { excluido: false },
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
        ultimo_acesso: true,
        desativado_por_inatividade: true,
        excluido: true,
        data_exclusao: true,
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

  async create(data: User): Promise<UserWithRelations> {
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
      ultimo_acesso,
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
        ultimo_acesso,
      },
      include: userRelationsInclude,
    });
  }

  async updateStatus(
    id: number,
    data: UserStatusUpdate,
  ): Promise<UserWithRelations> {
    return await this.prisma.novo_tabela_usuarios.update({
      where: { id },
      data,
      include: userRelationsInclude,
    });
  }

  async deactivateInactiveUsers(cutoffDate: Date): Promise<number> {
    const result = await this.prisma.novo_tabela_usuarios.updateMany({
      where: {
        ativo: true,
        excluido: false,
        ultimo_acesso: { lt: cutoffDate },
      },
      data: {
        ativo: false,
        desativado_por_inatividade: true,
      },
    });

    return result.count;
  }
}
