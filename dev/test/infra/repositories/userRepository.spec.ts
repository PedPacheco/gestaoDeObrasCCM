import { Test, TestingModule } from '@nestjs/testing';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import {
  userListSelect,
  userSelect,
  userWithPasswordSelect,
} from 'src/infra/mappers/user.mapper';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { UserRepository } from 'src/infra/repositories/userRepository';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  const prismaMock = {
    novo_tabela_usuarios: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  };

  /** Linha completa como o Prisma a devolveria com `userSelect`. */
  const baseRow = {
    id: 1,
    username: 'teste123',
    nome: 'teste',
    email: 'teste@gmail.com',
    tipo_usuario: TipoUsuario.INTERNO,
    is_admin: true,
    permissao_edicao: true,
    ativo: true,
    id_regional: 1,
    id_turma: 1,
    id_area: 8,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    userRepository = module.get(UserRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findByUsernameWithPassword', () => {
    it('devolve o utilizador com a senha quando existe', async () => {
      prismaMock.novo_tabela_usuarios.findFirst.mockResolvedValue({
        ...baseRow,
        senha: 'hash',
      });

      const result =
        await userRepository.findByUsernameWithPassword('teste123');

      expect(result).toStrictEqual({ ...baseRow, senha: 'hash' });
      expect(prismaMock.novo_tabela_usuarios.findFirst).toHaveBeenCalledWith({
        where: { username: 'teste123' },
        select: userWithPasswordSelect,
      });
    });

    it('devolve null quando não existe', async () => {
      prismaMock.novo_tabela_usuarios.findFirst.mockResolvedValue(null);

      const result =
        await userRepository.findByUsernameWithPassword('naoexiste');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('devolve o utilizador sem a senha', async () => {
      // simula uma linha com senha para garantir que o mapper a descarta
      prismaMock.novo_tabela_usuarios.findUnique.mockResolvedValue({
        ...baseRow,
        senha: 'hash',
      });

      const result = await userRepository.findById(1);

      expect(result).toStrictEqual(baseRow);
      expect(result).not.toHaveProperty('senha');
      expect(prismaMock.novo_tabela_usuarios.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: userSelect,
      });
    });

    it('devolve null quando não existe', async () => {
      prismaMock.novo_tabela_usuarios.findUnique.mockResolvedValue(null);

      expect(await userRepository.findById(99)).toBeNull();
    });
  });

  describe('findAll', () => {
    it('achata as relações em regional, parceira e area', async () => {
      prismaMock.novo_tabela_usuarios.findMany.mockResolvedValue([
        {
          ...baseRow,
          regionais: { regional: 'Norte' },
          turmas: { turma: 'Turma A' },
          areas: { nome: 'Obras' },
        },
      ]);

      const result = await userRepository.findAll();

      expect(result).toStrictEqual([
        { ...baseRow, regional: 'Norte', turma: 'Turma A', area: 'Obras' },
      ]);
      expect(prismaMock.novo_tabela_usuarios.findMany).toHaveBeenCalledWith({
        select: userListSelect,
      });
    });

    it('devolve null nas relações em falta', async () => {
      prismaMock.novo_tabela_usuarios.findMany.mockResolvedValue([
        { ...baseRow, regionais: null, turmas: null, areas: null },
      ]);

      const [result] = await userRepository.findAll();

      expect(result).toMatchObject({
        regional: null,
        turma: null,
        area: null,
      });
    });
  });

  describe('create', () => {
    it('persiste a entidade e devolve o registo sem a senha', async () => {
      const user = User.create({
        username: 'teste123',
        senha: 'hash',
        nome: 'teste',
        email: 'teste@gmail.com',
        tipo_usuario: TipoUsuario.INTERNO,
        id_regional: 1,
        id_turma: 1,
        id_area: 8,
        is_admin: true,
        permissao_edicao: true,
      });
      prismaMock.novo_tabela_usuarios.create.mockResolvedValue(baseRow);

      const result = await userRepository.create(user);

      expect(result).toStrictEqual(baseRow);
      expect(prismaMock.novo_tabela_usuarios.create).toHaveBeenCalledWith({
        data: {
          username: 'teste123',
          senha: 'hash',
          nome: 'teste',
          email: 'teste@gmail.com',
          tipo_usuario: TipoUsuario.INTERNO,
          is_admin: true,
          permissao_edicao: true,
          id_regional: 1,
          id_turma: 1,
          id_area: 8,
        },
        select: userSelect,
      });
    });
  });

  describe('updatePassword', () => {
    it('atualiza o hash e não o devolve', async () => {
      prismaMock.novo_tabela_usuarios.update.mockResolvedValue(baseRow);

      const result = await userRepository.updatePassword(1, 'novoHash');

      expect(result).toStrictEqual(baseRow);
      expect(result).not.toHaveProperty('senha');
      expect(prismaMock.novo_tabela_usuarios.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { senha: 'novoHash' },
        select: userSelect,
      });
    });
  });

  describe('softDelete', () => {
    it('marca ativo = false e devolve o registo', async () => {
      prismaMock.novo_tabela_usuarios.update.mockResolvedValue({
        ...baseRow,
        ativo: false,
      });

      const result = await userRepository.softDelete(1);

      expect(result.ativo).toBe(false);
      expect(prismaMock.novo_tabela_usuarios.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ativo: false },
        select: userSelect,
      });
    });
  });
});
