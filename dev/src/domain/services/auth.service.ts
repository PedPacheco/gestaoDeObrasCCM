import { compare, genSalt, hash } from 'bcrypt';
import { EmailService } from 'src/domain/services/email.service';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import { loginInterfaceService } from 'src/interface/types/userInterface';
import { generateRandomPassword } from 'src/utils/generatePassword';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { IAuthRepository } from '../repositories/IAuthRepository';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private authRepository: IAuthRepository,
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

    const payload = {
      sub: result.id,
      username: result.username,
      permissao: result.permissao,
      permissao_visualizacao: result.permissao_visualizacao,
    };

    return {
      id: result.id,
      username: result.username,
      id_regional: result.id_regional,
      nome_usuario: result.nome_usuario,
      email: result.email,
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: '1h',
      }),
    };
  }

  async register(registrationData: RegisterUserDTO): Promise<User> {
    const { username, senha, ...rest } = registrationData;

    const existingUser = await this.usersService.findUser(
      registrationData.username,
    );

    let password = registrationData.senha;

    if (existingUser) {
      throw new BadRequestException('Nome de usuário já está em uso.');
    }

    if (!password) {
      password = generateRandomPassword();
    }

    const salt = await genSalt();
    const hashedPassword = await hash(password, salt);

    const user = new User({
      ...registrationData,
      senha: hashedPassword,
    });

    const created = await this.authRepository.register(user);

    await this.emailService.sendEmail(
      '10009591@edp.com.br',
      'Bem vindo ao sistema',
      `Usuáro: ${registrationData.username} 
      Senha: ${password}`,
    );

    return created;
  }
}
