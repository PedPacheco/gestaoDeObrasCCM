import { usuario } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UserRepository } from 'src/infra/repositories/userRepository';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let prismaService: PrismaService;

  const prismaMock = {
    usuario: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('FindUser', () => {
    it('Should return user if found', async () => {
      const user = {
        id: 1,
        username: 'teste123',
        senha: '12345',
        permissao: 'Total',
        id_regional: 1,
        nome_usuario: 'teste',
        email: 'teste@gmail.com',
        permissao_visualizacao: 'parcial',
      } as usuario;

      prismaMock.usuario.findFirst.mockResolvedValue(user);

      const result = await userRepository.findUser(user.username);

      expect(result).toEqual(user);
      expect(prismaService.usuario.findFirst).toHaveBeenCalledWith({
        where: { username: 'teste123' },
      });
    });

    it('Should return null if no user is found', async () => {
      prismaMock.usuario.findFirst.mockResolvedValue(null);

      const result = await userRepository.findUser('noexistet');

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update and return user with new password', async () => {
      const numberId = 1;
      const newPassword = '13254';

      const mockUserResponse = {
        id: 3,
        username: 'teste123',
        senha: '13254',
      };

      prismaMock.usuario.update.mockResolvedValue(mockUserResponse);

      const result = await userRepository.updatePassword(numberId, newPassword);

      expect(result).toEqual(mockUserResponse);
      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: numberId },
        data: { senha: newPassword },
        select: {
          id: true,
          username: true,
          senha: true,
        },
      });
    });
  });
});
