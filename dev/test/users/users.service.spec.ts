import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { UsersService } from 'src/modules/users/users.service';
import { hash, genSalt } from 'bcrypt';
import { RegisterUserDTO } from 'src/config/dto/registerUserDto';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

describe('UsersService', () => {
  let usersService: UsersService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    username: 'teste123',
    senha: 'hashPassword',
    permissao: 'Total',
    id_regional: 1,
    permissao_visualizacao: 'parcial',
    formulario_utilizado: null,
    nome_maquina: null,
    nome_usuario: null,
    email: null,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        PrismaService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('findUser', () => {
    it('should return a user if found', async () => {
      jest
        .spyOn(prismaService.usuario, 'findFirst')
        .mockResolvedValue(mockUser);

      const user = await usersService.findUser('testuser');
      expect(user).toEqual(mockUser);
      expect(prismaService.usuario.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null if no user is found', async () => {
      jest.spyOn(prismaService.usuario, 'findFirst').mockResolvedValue(null);

      const user = await usersService.findUser('nonexistentuser');
      expect(user).toBeNull();
      expect(prismaService.usuario.findFirst).toHaveBeenCalledWith({
        where: { username: 'nonexistentuser' },
      });
    });
  });

  describe('updatePassword', () => {
    it('should update the password and return the updated user', async () => {
      const token = 'token';
      const userId = 1;
      const newPassword = 'newPassword';
      const salt = 'salt';
      const hashedPassword = 'hashedNewPassword';
      const updatedUser = {
        id: userId,
        username: 'testuser',
        senha: hashedPassword,
      };

      jwtService.verify = jest.fn().mockResolvedValue({ id: userId });
      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);
      prismaService.usuario.update = jest.fn().mockResolvedValue(updatedUser);

      const result = await usersService.updatePassword(token, newPassword);

      expect(result).toEqual(updatedUser);
      expect(prismaService.usuario.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { senha: hashedPassword },
        select: { id: true, username: true, senha: true },
      });
    });

    it('should return UnauthorizedException if the token is invalid or expired', async () => {
      (jwtService.verify as jest.Mock).mockRejectedValue(
        new Error('Token inválido ou expirado'),
      );

      await expect(
        usersService.updatePassword('token', 'newPassword'),
      ).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
    });
  });

  describe('registerUser', () => {
    it('should create user and return the created user', async () => {
      const request: RegisterUserDTO = {
        username: 'teste123',
        id_regional: 1,
        permissao: 'Total',
        nome_usuario: 'Teste',
        email: 'teste@gmail.com',
      };
      const password = 'hashPassword';
      jest.spyOn(prismaService.usuario, 'create').mockResolvedValue(mockUser);

      const result = await usersService.registerUser(request, password);

      expect(result).toEqual(mockUser);
      expect(prismaService.usuario.create).toHaveBeenCalledWith({
        data: {
          username: request.username,
          senha: password,
          permissao: request.permissao,
          id_regional: request.id_regional,
          email: request.email,
          nome_usuario: request.nome_usuario,
        },
        select: {
          id: true,
          username: true,
        },
      });
    });
  });
});
