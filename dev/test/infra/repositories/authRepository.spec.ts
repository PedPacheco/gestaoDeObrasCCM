import { Test, TestingModule } from '@nestjs/testing';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { AuthRepository } from 'src/infra/repositories/authRepository';

describe('AuthRepository', () => {
  let authRepository: AuthRepository;
  let prismaService: PrismaService;

  const prismaMock = {
    novo_tabela_usuarios: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    authRepository = module.get<AuthRepository>(AuthRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('Should create a user and return your data', async () => {
      const user: User = new User({
        username: 'teste123',
        senha: '12345',
        id_regional: 1,
        id_area: 8,
        id_turma: 1,
        tipo_usuario: TipoUsuario.INTERNO,
        permissao_edicao: true,
        is_admin: true,
        email: 'teste@gmail.com',
        nome: 'teste',
        ativo: true,
      });

      prismaMock.novo_tabela_usuarios.create.mockResolvedValue(user);

      const result = await authRepository.register(user);

      expect(result).toEqual(user);
      expect(prismaService.novo_tabela_usuarios.create).toHaveBeenCalledWith({
        data: {
          username: user.username,
          senha: user.senha,
          id_area: user.id_area,
          id_turma: user.id_turma,
          id_regional: user.id_regional,
          tipo_usuario: user.tipo_usuario,
          is_admin: user.is_admin,
          permissao_edicao: user.permissao_edicao,
          email: user.email,
          nome: user.nome,
        },
      });
    });
  });
});
