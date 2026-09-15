import { novo_tabela_usuarios } from '@prisma/client';
import { User } from 'src/domain/entities/user.entity';
// import { userInterface } from 'src/interface/types/userInterface';

export interface IUserRepository {
  findUser(username: string): Promise<novo_tabela_usuarios | null>;
  updatePassword(numberId: number, newPassword: string): Promise<any>;
  findAll(): Promise<novo_tabela_usuarios[]>;
  findByIdRaw(id: number): Promise<novo_tabela_usuarios | null>;
  create(user: User): Promise<novo_tabela_usuarios>;
  softDelete(id: number): Promise<novo_tabela_usuarios>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
