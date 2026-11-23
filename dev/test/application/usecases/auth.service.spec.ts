import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import type { RegisterUserInput } from 'src/application/types';
import { UsersService } from 'src/application/usecases/users.service';
import { USER_REPOSITORY } from 'src/domain/contracts/IUserRepository';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import { ValidationError } from 'src/domain/errors/domain.error';
import type { Mock } from 'vitest';

vi.mock('bcrypt', () => ({ hash: vi.fn(), compare: vi.fn() }));

const registerInput: RegisterUserInput = {
  username: 'username',
  senha: 'teste123',
  nome: 'test',
  email: 'teste@gmail.com',
  tipo_usuario: TipoUsuario.INTERNO,
  is_admin: true,
  permissao_edicao: true,
  id_regional: 1,
  id_turma: 2,
  id_area: 8,
};

const record = {
  id: 1,
  username: 'username',
  nome: 'test',
  email: 'teste@gmail.com',
  tipo_usuario: TipoUsuario.INTERNO,
  is_admin: true,
  permissao_edicao: true,
  ativo: true,
  id_regional: 1,
  id_turma: 2,
  id_area: 8,
};

describe('UsersService', () => {
  let service: UsersService;

  const repoMock = {
    findByUsernameWithPassword: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    existsByUsername: vi.fn(),
    create: vi.fn(),
    updatePassword: vi.fn(),
    softDelete: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: repoMock },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findUser', () => {
    it('devolve null quando não existe', async () => {
      repoMock.findByUsernameWithPassword.mockResolvedValue(null);
      expect(await service.findUser('x')).toBeNull();
    });

    it('devolve uma entidade User, mesmo se inativa', async () => {
      repoMock.findByUsernameWithPassword.mockResolvedValue({
        ...record,
        ativo: false,
        senha: 'hash',
      });

      const user = await service.findUser('username');

      expect(user).toBeInstanceOf(User);
      expect(user?.ativo).toBe(false);
    });
  });

  describe('listUsers', () => {
    it('devolve o resultado do repositório', async () => {
      const list = [
        { ...record, regional: 'Norte', parceira: 'Turma A', area: 'Obras' },
      ];
      repoMock.findAll.mockResolvedValue(list);

      expect(await service.listUsers()).toBe(list);
    });
  });

  describe('createUser', () => {
    it('lança BadRequestException sem palavra-passe, sem ir à base de dados', async () => {
      await expect(
        service.createUser({ ...registerInput, senha: undefined }),
      ).rejects.toThrow(
        new BadRequestException('A senha do usuário tem que ser enviada.'),
      );
      expect(repoMock.existsByUsername).not.toHaveBeenCalled();
    });

    it('lança BadRequestException se o username já existe', async () => {
      repoMock.existsByUsername.mockResolvedValue(true);

      await expect(service.createUser(registerInput)).rejects.toThrow(
        new BadRequestException('Nome de usuário já está em uso.'),
      );
      expect(repoMock.create).not.toHaveBeenCalled();
    });

    it('lança ValidationError para INTERNO sem área', async () => {
      repoMock.existsByUsername.mockResolvedValue(false);
      (hash as Mock).mockResolvedValue('hashed');

      await expect(
        service.createUser({ ...registerInput, id_area: undefined }),
      ).rejects.toThrow(
        new ValidationError(
          'Usuários internos devem possuir uma área vinculada.',
        ),
      );
      expect(repoMock.create).not.toHaveBeenCalled();
    });

    it('aplica o hash bcrypt e persiste a entidade', async () => {
      repoMock.existsByUsername.mockResolvedValue(false);
      (hash as Mock).mockResolvedValue('hashed');
      repoMock.create.mockResolvedValue(record);

      const result = await service.createUser(registerInput);

      expect(hash).toHaveBeenCalledWith('teste123', 10);
      const [user] = repoMock.create.mock.calls[0];
      expect(user).toBeInstanceOf(User);
      expect(user).toMatchObject({ senha: 'hashed', ativo: true, id_area: 8 });
      expect(result).toBe(record);
    });

    it('define id_area = null para PARCEIRA', async () => {
      repoMock.existsByUsername.mockResolvedValue(false);
      (hash as Mock).mockResolvedValue('hashed');

      await service.createUser({
        ...registerInput,
        tipo_usuario: TipoUsuario.PARCEIRA,
      });

      const [user] = repoMock.create.mock.calls[0];
      expect(user.id_area).toBeNull();
    });

    it('aplica valores por omissão a is_admin e permissao_edicao', async () => {
      repoMock.existsByUsername.mockResolvedValue(false);
      (hash as Mock).mockResolvedValue('hashed');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { is_admin, permissao_edicao, ...input } = registerInput;
      await service.createUser(input);

      const [user] = repoMock.create.mock.calls[0];
      expect(user).toMatchObject({ is_admin: false, permissao_edicao: false });
    });
  });

  describe('deactivateUser', () => {
    it('impede a autodesativação sem ir à base de dados', async () => {
      await expect(service.deactivateUser(1, 1)).rejects.toThrow(
        new BadRequestException('Você não pode desativar sua própria conta'),
      );
      expect(repoMock.findById).not.toHaveBeenCalled();
    });

    it('lança NotFoundException se o utilizador não existe', async () => {
      repoMock.findById.mockResolvedValue(null);

      await expect(service.deactivateUser(2, 1)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
      expect(repoMock.softDelete).not.toHaveBeenCalled();
    });

    it('desativa e devolve o registo', async () => {
      repoMock.findById.mockResolvedValue({ ...record, id: 2 });
      repoMock.softDelete.mockResolvedValue({ ...record, id: 2, ativo: false });

      const result = await service.deactivateUser(2, 1);

      expect(repoMock.softDelete).toHaveBeenCalledWith(2);
      expect(result.ativo).toBe(false);
    });
  });
});
