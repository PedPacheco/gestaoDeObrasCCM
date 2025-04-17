import { userInterface } from 'src/interface/types/userInterface';
import { User } from 'src/domain/entities/user.entity';

export interface IUserRepository {
  findUser(username: string): Promise<User | null>;
  updatePassword(numberId: number, newPassword: string): Promise<userInterface>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
