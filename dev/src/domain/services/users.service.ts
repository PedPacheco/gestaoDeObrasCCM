import { IUserRepository } from 'src/domain/repositories/IUserRepository';
import { genSalt, hash } from 'bcrypt';
import { userInterface } from 'src/interface/types/userInterface';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: IUserRepository,
    private jwtService: JwtService,
  ) {}

  async findUser(username: string): Promise<User | null> {
    const response = await this.userRepository.findUser(username);

    const user = new User(response);

    return user;
  }

  async updatePassword(
    token: string,
    newPassword: string,
  ): Promise<userInterface> {
    try {
      const { id } = await this.jwtService.verify(token);

      const numberId: number = +id;

      const saltRounds = await genSalt();
      const hashedPassword = await hash(newPassword, saltRounds);

      const user = await this.userRepository.updatePassword(
        numberId,
        hashedPassword,
      );

      return user;
    } catch (error: any) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
