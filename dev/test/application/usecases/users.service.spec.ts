import { genSalt, hash } from 'bcrypt';
import { UsersService } from 'src/application/usecases/users.service';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import { USER_REPOSITORY } from 'src/domain/repositories/IUserRepository';

import {
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserDTO } from 'src/interface/dtos/userDTO';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

const mockUserRepository = {
  findUser: jest.fn(),
  findAll: jest.fn(),
  findByIdRaw: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  updateUser: jest.fn(),
  updatePassword: jest.fn(),
  deactivateInactiveUsers: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('UsersService', () => {
  let usersService: UsersService;
  let jwtService: JwtService;

  const fixedDate = new Date('2026-09-18T12:00:00.000Z');

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
    ultimo_acesso: fixedDate,
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

  describe('updateStatus', () => {
    it('should deactivate an active user', async () => {
      const activeUser = { ...mockUser, ativo: true };
      mockUserRepository.findByIdRaw.mockResolvedValue(activeUser);
      mockUserRepository.updateStatus.mockResolvedValue({
        ...activeUser,
        ativo: false,
      });

      const result = await usersService.updateStatus(1);

      expect(mockUserRepository.updateStatus).toHaveBeenCalledWith(1, {
        ativo: false,
        ultimo_acesso: activeUser.ultimo_acesso,
      });
      expect(result.ativo).toBe(false);
    });

    it('should activate an inactive user', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-09-18T12:00:00.000Z'));

      const inactiveUser = { ...mockUser, ativo: false };
      mockUserRepository.findByIdRaw.mockResolvedValue(inactiveUser);
      mockUserRepository.updateStatus.mockResolvedValue({
        ...inactiveUser,
        ativo: true,
      });

      const result = await usersService.updateStatus(1);

      expect(mockUserRepository.updateStatus).toHaveBeenCalledWith(1, {
        ativo: true,
        ultimo_acesso: inactiveUser.ultimo_acesso,
      });
      expect(result.ativo).toBe(true);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(null);

      await expect(usersService.updateStatus(999)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });
  });

  describe('updateUser', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(null);

      const updateUser: UpdateUserDTO = {
        id_regional: 2,
        id_turma: 3,
        is_admin: false,
        permissao_edicao: true,
      } as UpdateUserDTO;

      await expect(usersService.updateUser(1, updateUser)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should update user with the value received', async () => {
      mockUserRepository.findByIdRaw.mockResolvedValue(mockUser);

      const updateUser: UpdateUserDTO = {
        id_regional: 2,
        id_turma: 3,
        is_admin: false,
        permissao_edicao: true,
      } as UpdateUserDTO;

      await usersService.updateUser(1, updateUser);

      const userToUpdateMock = {
        id: 1,
        username: 'teste123',
        senha: 'hashPassword',
        nome: undefined,
        email: undefined,
        tipo_usuario: undefined,
        is_admin: false,
        id_regional: 2,
        id_turma: 3,
        permissao_edicao: true,
        id_area: undefined,
        ativo: true,
        ultimo_acesso: fixedDate,
      };

      expect(mockUserRepository.updateUser).toHaveBeenCalledWith(
        1,
        userToUpdateMock,
      );
    });
  });

  describe('register', () => {
    const registerUser: RegisterUserDTO = {
      username: 'username',
      senha: 'teste123',
      nome: 'test',
      email: 'teste@gmail.com',
      id_regional: 1,
      id_turma: 2,
      id_area: 8,
      is_admin: true,
      tipo_usuario: TipoUsuario.INTERNO,
      permissao_edicao: true,
    };

    it('should throw BadRequestException when user already exists', async () => {
      mockUserRepository.findUser.mockResolvedValue(mockUser);

      await expect(usersService.createUser(registerUser)).rejects.toThrow(
        new BadRequestException('Nome de usuário já está em uso.'),
      );
    });

    it('should throw BadRequestExpection when password not sent', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(undefined);

      await expect(
        usersService.createUser({ ...mockUser, senha: undefined }),
      ).rejects.toThrow(
        new BadRequestException('A senha do usuário tem que ser enviada.'),
      );
    });

    it('should throw BadRequestExpection the internal user does not have a defined area.', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(
        usersService.createUser({ ...registerUser, id_area: undefined }),
      ).rejects.toThrow(
        new BadRequestException(
          'Usuários internos devem possuir uma área vinculada.',
        ),
      );
    });

    it('should be set the partner user area to null', async () => {
      const hashedPassword = 'hashPassword';

      mockUserRepository.findUser.mockResolvedValue(null);
      (genSalt as jest.Mock).mockResolvedValue(10);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockUserRepository.create.mockResolvedValue({
        ...registerUser,
        id: 1,
        senha: hashedPassword,
        id_area: null,
        tipo_usuario: TipoUsuario.PARCEIRA,
        ativo: true,
        ultimo_acesso: fixedDate,
        turmas: { turma: null },
        regionais: { regional: null },
        areas: null,
      });

      await usersService.createUser({
        ...registerUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
      });

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_area: null,
          tipo_usuario: TipoUsuario.PARCEIRA,
          ativo: true,
          ultimo_acesso: fixedDate,
        }),
      );
    });

    it('should create user and return user', async () => {
      const hashedPassword = 'hashPassword';

      mockUserRepository.findUser.mockResolvedValue(null);
      (genSalt as jest.Mock).mockResolvedValue(10);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockUserRepository.create.mockResolvedValue({
        ...registerUser,
        id: 1,
        senha: hashedPassword,
        ativo: true,
        ultimo_acesso: fixedDate,
        turmas: { turma: 'Turma A' },
        regionais: { regional: 'Regional X' },
        areas: { nome: 'Área Y' },
      });

      const result = await usersService.createUser(registerUser);

      expect(result).toEqual({
        id: 1,
        username: registerUser.username,
        senha: hashedPassword,
        nome: registerUser.nome,
        email: registerUser.email,
        tipo_usuario: registerUser.tipo_usuario,
        is_admin: registerUser.is_admin,
        permissao_edicao: registerUser.permissao_edicao,
        id_regional: registerUser.id_regional,
        id_turma: registerUser.id_turma,
        id_area: registerUser.id_area,
        ativo: true,
        ultimo_acesso: fixedDate,
        parceira: 'Turma A',
        regional: 'Regional X',
        area: 'Área Y',
      });
    });
  });

  describe('deactivateInactiveUsers', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('should deactivate users inactive since the cutoff date and return the count', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-09-18T12:00:00.000Z'));

      mockUserRepository.deactivateInactiveUsers.mockResolvedValue(5);

      const result = await usersService.deactivateInactiveUsers();

      expect(result).toBe(5);
      expect(mockUserRepository.deactivateInactiveUsers).toHaveBeenCalledWith(
        User.inactivityCutoffDate(),
      );
    });
  });
});
