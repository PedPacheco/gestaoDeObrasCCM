import { genSalt, hash } from 'bcrypt';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
  UserWithRelations,
} from 'src/domain/repositories/IUserRepository';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import { UpdateUserDTO } from 'src/interface/dtos/userDTO';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { novo_tabela_usuarios } from '@prisma/client';
import moment from 'moment';

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

  async updateStatus(id: number): Promise<any> {
    const raw = await this.userRepository.findByIdRaw(id);

    if (!raw) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const user = this.toEntity(raw);
    const isActivating = !user.ativo;

    const updated = await this.userRepository.updateStatus(id, {
      ativo: isActivating,
      ultimo_acesso: isActivating ? moment.utc().toDate() : user.ultimo_acesso,
    });

    return this.toSafeUser(updated);
  }

  async updateUser(id: number, data: UpdateUserDTO): Promise<any> {
    const raw = await this.userRepository.findByIdRaw(id);

    if (!raw) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const existingUser = this.toEntity(raw);
    const updatedUser = existingUser.applyUpdate(data);

    await this.userRepository.updateUser(id, updatedUser);
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

  async registerLoginAccess(user: User): Promise<void> {
    user.registerAccess();

    await this.userRepository.registerAccess(
      user.id as number,
      user.ultimo_acesso,
    );
  }

  async deactivateUserForInactivity(user: User): Promise<void> {
    user.deactivateForInactivity();

    await this.userRepository.updateStatus(user.id as number, {
      ativo: user.ativo,
    });
  }
}
