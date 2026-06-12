import { novo_tabela_usuarios } from '@prisma/client';
// import { userInterface } from 'src/interface/types/userInterface';

export interface IUserRepository {
  findUser(username: string): Promise<novo_tabela_usuarios | null>;
  updatePassword(numberId: number, newPassword: string): Promise<any>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
