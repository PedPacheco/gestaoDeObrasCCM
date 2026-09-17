import { genSalt, hash } from 'bcrypt';
import { UsersService } from 'src/application/usecases/users.service';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import { USER_REPOSITORY } from 'src/domain/repositories/IUserRepository';

import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

const mockUserRepository = {
  findUser: jest.fn(),
  updatePassword: jest.fn(),
  findAll: jest.fn(),
  findByIdRaw: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  deactivateInactiveUsers: jest.fn(),
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
    nome: 'teste',
    email: 'teste@gmail.com',
    tipo_usuario: TipoUsuario.INTERNO,
    is_admin: false,
    permissao_edicao: false,
    id_regional: 1,
    id_turma: 1,
    id_area: 8,
    ativo: true,
    ultimo_acesso: new Date(),
    desativado_por_inatividade: false,
    excluido: false,
    data_exclusao: null,
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
        ...mockUser,
        id: userId,
        senha: hashedPassword,
      };

      jwtService.verify = jest.fn().mockResolvedValue({ id: userId });
      mockUserRepository.findByIdRaw.mockResolvedValue(mockUser);
      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.updatePassword.mockResolvedValue(updatedUser);

      const result = await usersService.updatePassword(token, newPassword);

      expect(result).toEqual(new User(updatedUser));
      expect(mockUserRepository.findByIdRaw).toHaveBeenCalledWith(userId);
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

    it('should refuse (as invalid token) when the user is inactive', async () => {
      const token = 'token';
      const userId = 1;

      jwtService.verify = jest.fn().mockResolvedValue({ id: userId });
      mockUserRepository.findByIdRaw.mockResolvedValue({
        ...mockUser,
        ativo: false,
      });

      await expect(
        usersService.updatePassword(token, 'newPassword'),
      ).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should return UnauthorizedException when the user is not found', async () => {
      jwtService.verify = jest.fn().mockResolvedValue({ id: 999 });
      mockUserRepository.findByIdRaw.mockResolvedValue(null);

      await expect(
        usersService.updatePassword('token', 'newPassword'),
      ).rejects.toThrow(
        new UnauthorizedException('Token inválido ou expirado'),
      );
    });
  });

  describe('deactivateUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(null);

      await expect(usersService.deactivateUser(1, 2)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should refuse self-deactivation', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(mockUser);

      await expect(usersService.deactivateUser(1, 1)).rejects.toThrow(
        new BadRequestException('Você não pode desativar sua própria conta'),
      );
      expect(mockUserRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should deactivate the user through the repository', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(mockUser);
      mockUserRepository.updateStatus.mockResolvedValue({
        ...mockUser,
        ativo: false,
      });

      const result = await usersService.deactivateUser(1, 2);

      expect(mockUserRepository.updateStatus).toHaveBeenCalledWith(1, {
        ativo: false,
      });
      expect(result.ativo).toBe(false);
    });
  });

  describe('reactivateUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(null);

      await expect(usersService.reactivateUser(1)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should throw BadRequestException if user is already active', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(mockUser);

      await expect(usersService.reactivateUser(1)).rejects.toThrow(
        new BadRequestException('Usuário já está ativo'),
      );
    });

    it('should reactivate an inactive user, clearing desativado_por_inatividade', async () => {
      const inactiveUser = {
        ...mockUser,
        ativo: false,
        desativado_por_inatividade: true,
      };
      mockUserRepository.findByIdRaw.mockResolvedValue(inactiveUser);
      mockUserRepository.updateStatus.mockResolvedValue({
        ...inactiveUser,
        ativo: true,
        desativado_por_inatividade: false,
      });

      await usersService.reactivateUser(1);

      expect(mockUserRepository.updateStatus).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          ativo: true,
          desativado_por_inatividade: false,
          ultimo_acesso: expect.any(Date),
        }),
      );
    });
  });

  describe('changeUserPermission', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(null);

      await expect(usersService.changeUserPermission(1, true)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should update permissao_edicao with the value received', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(mockUser);
      mockUserRepository.updateStatus.mockResolvedValue({
        ...mockUser,
        permissao_edicao: true,
      });

      await usersService.changeUserPermission(1, true);

      expect(mockUserRepository.updateStatus).toHaveBeenCalledWith(1, {
        permissao_edicao: true,
      });
    });
  });

  describe('archiveUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(null);

      await expect(usersService.archiveUser(1, 2)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should refuse self-exclusion', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(mockUser);

      await expect(usersService.archiveUser(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUserRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should mark the user as excluido without deleting the row', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(mockUser);
      mockUserRepository.updateStatus.mockResolvedValue({
        ...mockUser,
        excluido: true,
        ativo: false,
      });

      await usersService.archiveUser(1, 2);

      expect(mockUserRepository.updateStatus).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          ativo: false,
          excluido: true,
          data_exclusao: expect.any(Date),
        }),
      );
    });
  });

  describe('deactivateInactiveUsers', () => {
    it('should call the repository with the inactivity cutoff date', async () => {
      mockUserRepository.deactivateInactiveUsers.mockResolvedValue(3);

      const result = await usersService.deactivateInactiveUsers();

      expect(result).toBe(3);
      expect(mockUserRepository.deactivateInactiveUsers).toHaveBeenCalledWith(
        expect.any(Date),
      );
    });
  });
});
