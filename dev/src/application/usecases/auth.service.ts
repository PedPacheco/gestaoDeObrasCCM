import { compare, genSalt, hash } from 'bcrypt';
import { User } from 'src/domain/entities/user.entity';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from 'src/domain/repositories/IAuthRepository';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import { generateRandomPassword } from 'src/utils/generatePassword';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { EmailService } from './email.service';
import { UsersService } from './users.service';
import { loginInterfaceService } from 'src/interface/types/userInterface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @Inject(AUTH_REPOSITORY) private authRepository: IAuthRepository,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<loginInterfaceService> {
    const result = await this.usersService.findUser(username);

    if (!result) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const user = new User(result);

    const isMatch = await compare(password, user.senha);

    if (!isMatch) {
      throw new UnauthorizedException('Senha incorreta');
    }

    const payload = {
      sub: user.id,
      username: user.username,
      tipo_usuario: user.tipo_usuario,
      is_admin: user.is_admin,
      permissao_edicao: user.permissao_edicao,
      id_turma: user.id_turma,
      id_area: user.id_area,
    };

    return {
      id: user.id,
      username: user.username,
      nome_usuario: user.nome,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
      is_admin: user.is_admin,
      permissao_edicao: user.permissao_edicao,
      id_regional: user.id_regional,
      id_turma: user.id_turma,
      id_area: user.id_area,
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async register(registrationData: RegisterUserDTO): Promise<User> {
    try {
      const { username, senha } = registrationData;

      const existingUser = await this.usersService.findUser(username);

      let password = senha;

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

      // await this.emailService.sendEmail(
      //   '10009591@edp.com.br',
      //   'Bem vindo ao sistema',
      //   `Usuário: ${username}
      // Senha: ${password}`,
      // );

      return created;
    } catch (error) {
      throw error;
    }
  }
}
