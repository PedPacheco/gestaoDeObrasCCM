import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import type {
  AuthLoginInput,
  AuthLoginOutput,
  RegisterUserInput,
} from 'src/application/types';
import type { UserRecord } from 'src/domain/types';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login({
    username,
    password,
  }: AuthLoginInput): Promise<AuthLoginOutput> {
    const user = await this.usersService.findUser(username);

    // Mesma mensagem para utilizador inexistente ou palavra-passe errada
    if (!user || !(await compare(password, user.senha))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Só depois de validar a palavra-passe, para não revelar contas inativas
    user.assertCanAuthenticate();

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
      tipo_usuario: user.tipo_usuario,
      is_admin: user.is_admin,
      permissao_edicao: user.permissao_edicao,
      id_turma: user.id_turma,
      id_area: user.id_area,
    });

    // Montado campo a campo: a senha nunca entra no retorno
    return {
      id: user.id!,
      username: user.username,
      id_regional: user.id_regional,
      nome_usuario: user.nome,
      email: user.email,
      access_token,
      is_admin: user.is_admin,
      permissao_edicao: user.permissao_edicao,
      id_turma: user.id_turma,
      id_area: user.id_area, // ver nota abaixo
      tipo_usuario: user.tipo_usuario,
    };
  }

  async register(input: RegisterUserInput): Promise<UserRecord> {
    return this.usersService.createUser(input);
  }
}
