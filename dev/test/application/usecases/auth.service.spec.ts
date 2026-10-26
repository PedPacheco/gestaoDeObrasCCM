import type { Mock } from 'vitest';
import { compare, genSalt, hash } from 'bcrypt';
import { AuthService } from 'src/application/usecases/auth.service';
import { UsersService } from 'src/application/usecases/users.service';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import { AUTH_REPOSITORY } from 'src/domain/repositories/IAuthRepository';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import { generateRandomPassword } from 'src/utils/generatePassword';

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

const mockAuthRepository = {
  register: vi.fn(),
};

vi.mock('src/utils/generatePassword');

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

const loginUser = {
  id: 1,
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
  ativo: true,
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findUser: vi.fn(),
            registerUser: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
            sign: vi.fn(),
          },
        },
        {
          provide: AUTH_REPOSITORY,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('should throw NotFoundExpection if user is not found', async () => {
      vi.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(authService.login('7081545', 'pedro132')).rejects.toThrow(
        new UnauthorizedException('Usuário ou senha inválidos'),
      );
    });

    it('should throw UnauthorizedExpection if password is incorrect', async () => {
      vi
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User(loginUser));
      (compare as Mock).mockResolvedValue(false);

      await expect(
        authService.login('username', 'wrong_password'),
      ).rejects.toThrow(
        new UnauthorizedException('Usuário ou senha inválidos'),
      );
    });

    it('should throw BadRequestException if user is not active', async () => {
      vi.spyOn(usersService, 'findUser').mockResolvedValue({
        ...loginUser,
        ativo: false,
      } as User);

      await expect(authService.login('username', 'teste123')).rejects.toThrow(
        new BadRequestException('Usuário está inativo no sistema'),
      );
    });

    it('should return user and access_token if login is successful', async () => {
      const access_token = 'jwt_token';

      vi
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User(loginUser));
      (compare as Mock).mockResolvedValue(true);
      vi.spyOn(jwtService, 'signAsync').mockResolvedValue(access_token);

      const result = await authService.login('username', 'teste123');

      expect(result).toEqual({
        id: loginUser.id,
        id_area: loginUser.id_area,
        id_turma: loginUser.id_turma,
        id_regional: loginUser.id_regional,
        is_admin: loginUser.is_admin,
        permissao_edicao: loginUser.permissao_edicao,
        tipo_usuario: loginUser.tipo_usuario,
        username: loginUser.username,
        nome_usuario: loginUser.nome,
        email: loginUser.email,
        access_token: access_token,
      });
    });
  });

  describe('register', () => {
    it('should throw BadRequestExpection when user already exists', async () => {
      vi
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User(loginUser));

      await expect(authService.register(loginUser)).rejects.toThrow(
        new BadRequestException('Nome de usuário já está em uso.'),
      );
    });

    it('should throw BadRequestExpection when password not sent', async () => {
      vi.spyOn(usersService, 'findUser').mockResolvedValue(undefined);

      await expect(
        authService.register({ ...loginUser, senha: undefined }),
      ).rejects.toThrow(
        new BadRequestException('A senha do usuário tem que ser enviada.'),
      );
    });

    it('should throw BadRequestExpection the internal user does not have a defined area.', async () => {
      vi.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(
        authService.register({ ...registerUser, id_area: undefined }),
      ).rejects.toThrow(
        new BadRequestException(
          'Usuários internos devem possuir uma área vinculada.',
        ),
      );
    });

    it('should be set the partner user area to null', async () => {
      const salt = 10;
      const hashedPassword = 'hashPassword';

      vi.spyOn(usersService, 'findUser').mockResolvedValue(
        new User({
          ...registerUser,
          tipo_usuario: TipoUsuario.PARCEIRA,
          ativo: true,
        }),
      );

      vi.spyOn(usersService, 'findUser').mockResolvedValue(null);

      (genSalt as Mock).mockResolvedValue(salt);
      (hash as Mock).mockResolvedValue(hashedPassword);

      await authService.register({
        ...registerUser,
        senha: hashedPassword,
        tipo_usuario: TipoUsuario.PARCEIRA,
      });

      expect(mockAuthRepository.register).toHaveBeenCalledWith({
        ...registerUser,
        senha: hashedPassword,
        id_area: null,
        tipo_usuario: 'PARCEIRA',
        ativo: true,
      });
    });

    it('should create user and return user', async () => {
      const salt = 10;
      const hashedPassword = 'hashPassword';

      vi.spyOn(usersService, 'findUser').mockResolvedValue(null);

      (genSalt as Mock).mockResolvedValue(salt);
      (hash as Mock).mockResolvedValue(hashedPassword);

      const user = new User({
        ...registerUser,
        senha: hashedPassword,
        ativo: true,
      });

      vi.spyOn(usersService, 'findUser').mockResolvedValue(null);
      mockAuthRepository.register.mockResolvedValue(user);
      (generateRandomPassword as Mock).mockReturnValue('hashPassword');

      const result = await authService.register(registerUser);

      expect(result).toEqual(user);
    });
  });
});
