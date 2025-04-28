import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/domain/repositories/IUserRepository';
import { genSalt, hash } from 'bcrypt';

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private jwtService: JwtService,
  ) {}

  async findUser(username: string): Promise<User | null> {
    const response = await this.userRepository.findUser(username);

    if (response === null) {
      return null;
    }

    const user = new User(response);

    return user;
  }

  async updatePassword(token: string, newPassword: string): Promise<User> {
    try {
      const { id } = await this.jwtService.verify(token);

      const numberId: number = +id;

      const saltRounds = await genSalt();
      const hashedPassword = await hash(newPassword, saltRounds);

      const response = await this.userRepository.updatePassword(
        numberId,
        hashedPassword,
      );

      const user = new User(response);

      return user;
    } catch (error: any) {
      console.log(error);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
