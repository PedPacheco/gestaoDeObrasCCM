import { genSalt, hash } from 'bcrypt';
import { User } from 'src/domain/entities/user.entity';
import { USER_REPOSITORY } from 'src/domain/repositories/IUserRepository';

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from 'src/application/users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

const mockUserRepository = {
  findUser: jest.fn(),
  updatePassword: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('UsersService', () => {
  let usersService: UsersService;
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
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('findUser', () => {
    it('should return a user if found', async () => {
      const userData = { ...mockUser };

      mockUserRepository.findUser.mockResolvedValue(userData);

      const user = await usersService.findUser('testuser');
      expect(user).toEqual(new User(userData));
      expect(mockUserRepository.findUser).toHaveBeenCalledWith('testuser');
    });

    it('should return null if no user is found', async () => {
      mockUserRepository.findUser.mockResolvedValue(null);

      const user = await usersService.findUser('nonexistentuser');
      expect(user).toBeNull();
      expect(mockUserRepository.findUser).toHaveBeenCalledWith(
        'nonexistentuser',
      );
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
      mockUserRepository.updatePassword.mockResolvedValue(updatedUser);

      const result = await usersService.updatePassword(token, newPassword);

      expect(result).toEqual(new User(result));
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(
        userId,
        hashedPassword,
      );
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
});
