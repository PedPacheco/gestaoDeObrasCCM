import { UsersService } from '../users/users.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, genSalt, hash } from 'bcrypt';
import { RegisterUserDTO } from 'src/config/dto/registerUserDto';
import { EmailService } from 'src/modules/email/email.service';
import {
  loginInterfaceService,
  userRegisterInterfaceService,
} from 'src/types/userInterface';
import { generateRandomPassword } from 'src/utils/generatePassword';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<loginInterfaceService> {
    const result = await this.usersService.findUser(username);

    if (!result) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isMatch = await compare(password, result.senha);

    if (!isMatch) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const payload = { sub: result.id, username: result.username };

    return {
      id: result.id,
      username: result.username,
      permissao: result.permissao,
      id_regional: result.id_regional,
      nome_usuario: result.nome_usuario,
      email: result.email,
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: '1h',
      }),
    };
  }

  async register(
    registerUserDto: RegisterUserDTO,
  ): Promise<userRegisterInterfaceService> {
    const existingUser = await this.usersService.findUser(
      registerUserDto.username,
    );

    if (existingUser) {
      throw new BadRequestException('Nome de usuário já está em uso.');
    }

    const password = generateRandomPassword();

    const salt = await genSalt();
    const hashedPassword = await hash(password, salt);

    const user = await this.usersService.registerUser(
      registerUserDto,
      hashedPassword,
    );

    await this.emailService.sendEmail(
      registerUserDto.email,
      'Bem vindo ao sistema',
      `Usuáro: ${registerUserDto.username} 
      Senha: ${password}`,
    );

    return user;
  }

  async resetPassword(username: string): Promise<void> {
    const user = await this.usersService.findUser(username);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const payload = { id: user.id };

    const resetToken = this.jwtService.sign(payload, { expiresIn: '30m' });

    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    await this.emailService.sendEmail(
      user.email,
      'Redefinição de senha',
      `Clique no link abaixo para redefinir sua senha: ${resetLink}`,
    );
  }
}
