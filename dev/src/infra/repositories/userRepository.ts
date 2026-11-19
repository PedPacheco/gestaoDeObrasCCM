import { Injectable } from '@nestjs/common';
import { IUserRepository } from 'src/domain/contracts/IUserRepository';
import { User } from 'src/domain/entities/user.entity';
import type {
  UserListItemRecord,
  UserRecord,
  UserWithPasswordRecord,
} from 'src/domain/types';
import {
  toUserListItemRecord,
  toUserRecord,
  toUserWithPasswordRecord,
  userListSelect,
  userSelect,
  userWithPasswordSelect,
} from '../mappers/user.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsernameWithPassword(
    username: string,
  ): Promise<UserWithPasswordRecord | null> {
    const row = await this.prisma.novo_tabela_usuarios.findFirst({
      where: { username },
      select: userWithPasswordSelect,
    });
    return row ? toUserWithPasswordRecord(row) : null;
  }

  async findById(id: number): Promise<UserRecord | null> {
    const row = await this.prisma.novo_tabela_usuarios.findUnique({
      where: { id },
      select: userSelect,
    });
    return row ? toUserRecord(row) : null;
  }

  async findAll(): Promise<UserListItemRecord[]> {
    const rows = await this.prisma.novo_tabela_usuarios.findMany({
      select: userListSelect,
    });
    return rows.map(toUserListItemRecord);
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.prisma.novo_tabela_usuarios.count({
      where: { username },
    });
    return count > 0;
  }

  async create(user: User): Promise<UserRecord> {
    const row = await this.prisma.novo_tabela_usuarios.create({
      data: {
        username: user.username,
        senha: user.senha,
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        is_admin: user.is_admin,
        permissao_edicao: user.permissao_edicao,
        id_regional: user.id_regional,
        id_turma: user.id_turma,
        id_area: user.id_area,
      },
      select: userSelect,
    });
    return toUserRecord(row);
  }

  async updatePassword(id: number, passwordHash: string): Promise<UserRecord> {
    const row = await this.prisma.novo_tabela_usuarios.update({
      where: { id },
      data: { senha: passwordHash },
      select: userSelect,
    });
    return toUserRecord(row);
  }

  async softDelete(id: number): Promise<UserRecord> {
    const row = await this.prisma.novo_tabela_usuarios.update({
      where: { id },
      data: { ativo: false },
      select: userSelect,
    });
    return toUserRecord(row);
  }
}
