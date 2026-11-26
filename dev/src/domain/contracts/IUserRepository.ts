import type { User } from '../entities/user.entity';
import {
  UserListItemRecord,
  UserRecord,
  UserWithPasswordRecord,
} from '../types';

export interface IUserRepository {
  findByUsernameWithPassword(
    username: string,
  ): Promise<UserWithPasswordRecord | null>;
  findById(id: number): Promise<UserRecord | null>;
  findAll(): Promise<UserListItemRecord[]>;
  existsByUsername(username: string): Promise<boolean>;
  create(user: User): Promise<UserRecord>;
  updatePassword(id: number, passwordHash: string): Promise<UserRecord>;
  softDelete(id: number): Promise<UserRecord>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
