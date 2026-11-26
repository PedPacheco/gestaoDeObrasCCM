import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import type { RegisterUserInput } from 'src/application/types';
import {
  IUserRepository,
  USER_REPOSITORY,
} from 'src/domain/contracts/IUserRepository';
import { User } from 'src/domain/entities/user.entity';
import type { UserListItemRecord, UserRecord } from 'src/domain/types';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  /** Inclui a senha (hash). Só para autenticação. */
  async findUser(username: string): Promise<User | null> {
    const record =
      await this.userRepository.findByUsernameWithPassword(username);
    return record ? User.restore(record) : null;
  }

  async listUsers(): Promise<UserListItemRecord[]> {
    return this.userRepository.findAll();
  }

  async createUser(input: RegisterUserInput): Promise<UserRecord> {
    if (!input.senha) {
      throw new BadRequestException('A senha do usuário tem que ser enviada.');
    }

    if (await this.userRepository.existsByUsername(input.username)) {
      throw new BadRequestException('Nome de usuário já está em uso.');
    }

    const senhaHash = await hash(input.senha, BCRYPT_SALT_ROUNDS);
    return this.userRepository.create(
      User.create({ ...input, senha: senhaHash }),
    );
  }

  async deactivateUser(id: number, requesterId: number): Promise<UserRecord> {
    if (id === requesterId) {
      throw new BadRequestException(
        'Você não pode desativar sua própria conta',
      );
    }

    const target = await this.userRepository.findById(id);
    if (!target) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.userRepository.softDelete(id);
  }

  async deactivateInactiveUsers(): Promise<number> {
    return await this.userRepository.deactivateInactiveUsers(
      User.inactivityCutoffDate(),
    );
  }
}
