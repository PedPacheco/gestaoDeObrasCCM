import { novo_tabela_usuarios } from '@prisma/client';
import { EditableUserData, User } from 'src/domain/entities/user.entity';

export type UserWithRelations = Pick<
  novo_tabela_usuarios,
  | 'id'
  | 'id_regional'
  | 'id_turma'
  | 'id_area'
  | 'tipo_usuario'
  | 'is_admin'
  | 'permissao_edicao'
  | 'username'
  | 'nome'
  | 'email'
  | 'ativo'
  | 'ultimo_acesso'
> & {
  regionais?: { regional: string } | null;
  turmas?: { turma: string } | null;
  areas?: { nome: string } | null;
};

export type UserStatusUpdate = Partial<
  Pick<novo_tabela_usuarios, 'ativo' | 'permissao_edicao' | 'ultimo_acesso'>
>;

export interface IUserRepository {
  findUser(username: string): Promise<novo_tabela_usuarios | null>;
  findAll(): Promise<UserWithRelations[]>;
  findByIdRaw(id: number): Promise<novo_tabela_usuarios | null>;
  create(user: User): Promise<UserWithRelations>;
  updateStatus(id: number, data: UserStatusUpdate): Promise<UserWithRelations>;
  updatePassword(numberId: number, newPassword: string): Promise<any>;
  updateUser(id: number, data: EditableUserData): Promise<void>;
  registerAccess(id: number, ultimo_acesso: Date): Promise<void>;
  deactivateInactiveUsers(cutoffDate: Date): Promise<number>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
