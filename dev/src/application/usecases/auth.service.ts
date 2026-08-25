import { compare, genSalt, hash } from 'bcrypt';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from 'src/domain/contracts/IAuthRepository';
import { User } from 'src/domain/entities/user.entity';

import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from './users.service';
import { AuthLoginInput, AuthLoginOutput, RegisterUserInput } from '../types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject(AUTH_REPOSITORY) private authRepository: IAuthRepository,
  ) {}

  async login({
    username,
    password,
  }: AuthLoginInput): Promise<AuthLoginOutput> {
    const result = await this.usersService.findUser(username);

    const invalidCredentialsException = new UnauthorizedException(
      'Usuário ou senha inválidos',
    );

    if (!result) {
      throw invalidCredentialsException;
    }

    const user = new User(result);

    const isMatch = await compare(password, user.senha);

    if (!isMatch) {
      throw invalidCredentialsException;
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

  async register(registrationData: RegisterUserInput): Promise<User> {
    const { username, senha } = registrationData;

    const existingUser = await this.usersService.findUser(username);

    let password = senha;

    if (existingUser) {
      throw new BadRequestException('Nome de usuário já está em uso.');
    }

    if (!password) {
      throw new BadRequestException('A senha do usuário tem que ser enviada.');
    }

    const salt = await genSalt();
    const hashedPassword = await hash(password, salt);

    const user = new User({
      ...registrationData,
      senha: hashedPassword,
    });

    const created = await this.authRepository.register(user);

    return created;
  }
}
