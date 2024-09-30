import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, genSalt } from 'bcrypt';
import { PrismaService } from '../../config/prisma/prisma.service';
import {
  userInterface,
  userRegisterInterfaceService,
} from 'src/types/userInterface';
import { RegisterUserDTO } from 'src/config/dto/registerUserDto';
import { JwtService } from '@nestjs/jwt';
import { usuario } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async findUser(username: string): Promise<usuario | null> {
    return await this.prisma.usuario.findFirst({
      where: { username },
    });
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

      const user = await this.prisma.usuario.update({
        where: { id: numberId },
        data: { senha: hashedPassword },
        select: {
          id: true,
          username: true,
          senha: true,
        },
      });

      return user;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async registerUser(
    { username, permissao, id_regional, email, nome_usuario }: RegisterUserDTO,
    password: string,
  ): Promise<userRegisterInterfaceService> {
    const user = await this.prisma.usuario.create({
      data: {
        username,
        senha: password,
        permissao,
        id_regional,
        email,
        nome_usuario,
      },
      select: {
        id: true,
        username: true,
      },
    });

    return user;
  }
}
