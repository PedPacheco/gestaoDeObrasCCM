import { TipoUsuario } from 'src/domain/entities/user.entity';
import {
  UserListItemRecord,
  UserRecord,
  UserWithPasswordRecord,
} from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';

// ---------- selects ----------
export const userSelect = {
  id: true,
  username: true,
  nome: true,
  email: true,
  tipo_usuario: true,
  is_admin: true,
  permissao_edicao: true,
  ativo: true,
  id_regional: true,
  id_turma: true,
  id_area: true,
} satisfies Prisma.novo_tabela_usuariosSelect;

export const userWithPasswordSelect = {
  ...userSelect,
  senha: true,
} satisfies Prisma.novo_tabela_usuariosSelect;

export const userListSelect = {
  ...userSelect,
  regionais: { select: { regional: true } },
  turmas: { select: { turma: true } },
  areas: { select: { nome: true } },
} satisfies Prisma.novo_tabela_usuariosSelect;

// ---------- rows ----------
type UserRow = Prisma.novo_tabela_usuariosGetPayload<{
  select: typeof userSelect;
}>;
type UserWithPasswordRow = Prisma.novo_tabela_usuariosGetPayload<{
  select: typeof userWithPasswordSelect;
}>;
type UserListRow = Prisma.novo_tabela_usuariosGetPayload<{
  select: typeof userListSelect;
}>;

// ---------- mappers ----------
export function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    nome: row.nome,
    email: row.email,
    tipo_usuario: row.tipo_usuario as TipoUsuario, // ver nota abaixo
    is_admin: row.is_admin,
    permissao_edicao: row.permissao_edicao,
    ativo: row.ativo,
    id_regional: row.id_regional,
    id_turma: row.id_turma,
    id_area: row.id_area,
  };
}

export function toUserWithPasswordRecord(
  row: UserWithPasswordRow,
): UserWithPasswordRecord {
  return { ...toUserRecord(row), senha: row.senha };
}

export function toUserListItemRecord(row: UserListRow): UserListItemRecord {
  return {
    ...toUserRecord(row),
    regional: row.regionais?.regional ?? null,
    turma: row.turmas?.turma ?? null,
    area: row.areas?.nome ?? null,
  };
}
