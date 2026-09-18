import { compare } from 'bcrypt';

import { loginInterfaceService } from 'src/interface/types/userInterface';

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<loginInterfaceService> {
    const user = await this.usersService.findUser(username);

    const invalidCredentialsException = new UnauthorizedException(
      'Usuário ou senha inválidos',
    );

    if (!user) {
      throw invalidCredentialsException;
    }

    user.ensureCanLogin();

    const isMatch = await compare(password, user.senha);

    if (!isMatch) {
      throw invalidCredentialsException;
    }

    if (user.exceededInactivityLimit()) {
      throw new BadRequestException(
        'Conta desativada por falta de acesso há mais de 60 dias. Procure um administrador.',
      );
    }
    await this.usersService.registerLoginAccess(user);

    const payload = {
      sub: user.id,
      username: user.username,
      tipo_usuario: user.tipo_usuario,
      is_admin: user.is_admin,
      permissao_edicao: user.permissao_edicao,
      id_turma: user.id_turma,
      id_area: user.id_area,
      ultimo_acesso: user.ultimo_acesso,
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
}
