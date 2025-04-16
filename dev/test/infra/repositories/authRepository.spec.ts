import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/domain/entities/user.entity';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { AuthRepository } from 'src/infra/repositories/authRepository';

describe('AuthRepository', () => {
  let authRepository: AuthRepository;
  let prismaService: PrismaService;

  const prismaMock = {
    usuario: {
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
      const user: User = {
        id: 1,
        username: 'teste123',
        senha: '12345',
        permissao: 'Total',
        id_regional: 1,
        email: 'teste@gmail.com',
        nome_usuario: 'teste',
        permissao_visualizacao: 'parcial',
      };

      prismaMock.usuario.create.mockResolvedValue(user);

      const result = await authRepository.register({
        username: user.username,
        senha: user.senha,
        permissao: user.permissao,
        id_regional: user.id_regional,
        email: user.email,
        nome_usuario: user.nome_usuario,
        permissao_visualizacao: user.permissao_visualizacao,
      });

      expect(result).toEqual(user);
      expect(prismaService.usuario.create).toHaveBeenCalledWith({
        data: {
          username: user.username,
          senha: user.senha,
          permissao: user.permissao,
          id_regional: user.id_regional,
          email: user.email,
          nome_usuario: user.nome_usuario,
          permissao_visualizacao: user.permissao_visualizacao,
        },
      });
    });
  });
});
