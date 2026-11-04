import { novo_tabela_usuarios } from 'src/infra/generated/prisma/client';
import { User } from '../entities/user.entity';
import { userResponse } from '../types';

export interface IUserRepository {
  findUser(username: string): Promise<userResponse | null>;
  updatePassword(numberId: number, newPassword: string): Promise<userResponse>;
  findAll(): Promise<any[]>;
  findByIdRaw(id: number): Promise<novo_tabela_usuarios | null>;
  create(user: User): Promise<novo_tabela_usuarios>;
  softDelete(id: number): Promise<novo_tabela_usuarios>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
