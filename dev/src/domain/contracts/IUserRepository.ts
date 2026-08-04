import { userReponse } from 'src/domain/types';

export interface IUserRepository {
  findUser(username: string): Promise<userReponse | null>;
  updatePassword(numberId: number, newPassword: string): Promise<userReponse>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
