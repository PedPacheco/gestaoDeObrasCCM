import { genSalt, hash } from 'bcrypt';
import { novo_tabela_usuarios } from '@prisma/client';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import {
  IUserRepository,
  USER_REPOSITORY,
  UserWithRelations,
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

  private toEntity(raw: novo_tabela_usuarios): User {
    return new User({
      ...raw,
      tipo_usuario: raw.tipo_usuario as TipoUsuario,
    });
  }

  private toSafeUser(record: UserWithRelations) {
    const { turmas, regionais, areas, ...rest } = record;

    return {
      ...rest,
      parceira: turmas?.turma ?? null,
      regional: regionais?.regional ?? null,
      area: areas?.nome ?? null,
    };
  }

  async findUser(username: string): Promise<User | null> {
    const response = await this.userRepository.findUser(username);

    if (response === null) {
      return null;
    }

    return this.toEntity(response);
  }

  async updatePassword(token: string, newPassword: string): Promise<User> {
    try {
      const { id } = await this.jwtService.verify(token);

      const numberId: number = +id;

      const raw = await this.userRepository.findByIdRaw(numberId);

      if (!raw) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      const user = this.toEntity(raw);

      user.ensureCanLogin();

      const saltRounds = await genSalt();
      const hashedPassword = await hash(newPassword, saltRounds);

      const response = await this.userRepository.updatePassword(
        numberId,
        hashedPassword,
      );

      return this.toEntity(response);
    } catch (error: any) {
      console.log(error);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async listUsers(): Promise<any[]> {
    const users = await this.userRepository.findAll();

    return users.map((user) => this.toSafeUser(user));
  }

  async createUser(dto: RegisterUserDTO): Promise<any> {
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
    user.registerAccess();

    const created = await this.userRepository.create(user);

    return this.toSafeUser(created);
  }

  async deactivateUser(id: number, requesterId: number): Promise<any> {
    const raw = await this.userRepository.findByIdRaw(id);

    if (!raw) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const user = this.toEntity(raw);
    user.deactivate(requesterId);

    const updated = await this.userRepository.updateStatus(id, {
      ativo: user.ativo,
    });

    return this.toSafeUser(updated);
  }

  async reactivateUser(id: number): Promise<any> {
    const raw = await this.userRepository.findByIdRaw(id);

    if (!raw) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const user = this.toEntity(raw);
    user.reactivate();

    const updated = await this.userRepository.updateStatus(id, {
      ativo: user.ativo,
      desativado_por_inatividade: user.desativado_por_inatividade,
      ultimo_acesso: user.ultimo_acesso,
    });

    return this.toSafeUser(updated);
  }

  async changeUserPermission(
    id: number,
    permissaoEdicao: boolean,
  ): Promise<any> {
    const raw = await this.userRepository.findByIdRaw(id);

    if (!raw) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const user = this.toEntity(raw);
    user.changeEditPermission(permissaoEdicao);

    const updated = await this.userRepository.updateStatus(id, {
      permissao_edicao: user.permissao_edicao,
    });

    return this.toSafeUser(updated);
  }

  async archiveUser(id: number, requesterId: number): Promise<any> {
    const raw = await this.userRepository.findByIdRaw(id);

    if (!raw) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const user = this.toEntity(raw);
    user.archive(requesterId);

    const updated = await this.userRepository.updateStatus(id, {
      ativo: user.ativo,
      excluido: user.excluido,
      data_exclusao: user.data_exclusao,
    });

    return this.toSafeUser(updated);
  }

  async registerLoginAccess(user: User): Promise<void> {
    user.registerAccess();

    await this.userRepository.updateStatus(user.id as number, {
      ultimo_acesso: user.ultimo_acesso,
    });
  }

  async deactivateUserForInactivity(user: User): Promise<void> {
    user.deactivateForInactivity();

    await this.userRepository.updateStatus(user.id as number, {
      ativo: user.ativo,
      desativado_por_inatividade: user.desativado_por_inatividade,
    });
  }

  async deactivateInactiveUsers(): Promise<number> {
    return this.userRepository.deactivateInactiveUsers(
      User.inactivityCutoffDate(),
    );
  }
}
