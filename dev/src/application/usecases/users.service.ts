import { genSalt, hash } from 'bcrypt';
import { novo_tabela_usuarios } from '@prisma/client';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/domain/repositories/IUserRepository';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

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

    const user = new User({
      ...response,
      tipo_usuario: response.tipo_usuario as TipoUsuario,
    });

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

  async listUsers(): Promise<any[]> {
    const users = await this.userRepository.findAll();

    return users.map(({ turmas, regionais, areas, ...rest }) => ({
      ...rest,
      parceira: turmas?.turma,
      regional: regionais?.regional,
      area: areas?.nome,
    }));
  }

  async createUser(dto: RegisterUserDTO): Promise<novo_tabela_usuarios> {
    const existingUser = await this.userRepository.findUser(dto.username);

    if (existingUser) {
      throw new BadRequestException('Nome de usuário já está em uso.');
    }

    if (!dto.senha) {
      throw new BadRequestException('A senha do usuário tem que ser enviada.');
    }

    const salt = await genSalt();
    const hashedPassword = await hash(dto.senha, salt);

    const user = new User({ ...dto, senha: hashedPassword });

    return await this.userRepository.create(user);
  }

  async deactivateUser(
    id: number,
    requesterId: number,
  ): Promise<novo_tabela_usuarios> {
    const target = await this.userRepository.findByIdRaw(id);

    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (target.id === requesterId) {
      throw new BadRequestException(
        'Você não pode desativar sua própria conta',
      );
    }

    return await this.userRepository.softDelete(id);
  }

  async reactivateUser(id: number): Promise<novo_tabela_usuarios> {
    const target = await this.userRepository.findByIdRaw(id);

    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (target.ativo) {
      throw new BadRequestException('Usuário já está ativo');
    }

    return await this.userRepository.reactivate(id);
  }

  async togglePermissaoEdicao(id: number): Promise<novo_tabela_usuarios> {
    const target = await this.userRepository.findByIdRaw(id);

    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return await this.userRepository.updatePermissaoEdicao(
      id,
      !target.permissao_edicao,
    );
  }
}
