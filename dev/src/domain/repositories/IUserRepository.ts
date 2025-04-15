import { userInterface } from 'src/interface/types/userInterface';
import { User } from '../entities/user.entity';

export abstract class IUserRepository {
  abstract findUser(username: string): Promise<User | null>;
  abstract updatePassword(
    numberId: number,
    newPassword: string,
  ): Promise<userInterface>;
}
