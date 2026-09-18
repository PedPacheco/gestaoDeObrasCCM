import { compare } from 'bcrypt';
import { AuthService } from 'src/application/usecases/auth.service';
import { UsersService } from 'src/application/usecases/users.service';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';

import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import moment from 'moment';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

jest.mock('src/utils/generatePassword');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const fixedDate = new Date('2026-09-18T12:00:00.000Z');

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
    ultimo_acesso: fixedDate,
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
    jest.spyOn(moment, 'utc').mockReturnValue(moment(fixedDate));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findUser: jest.fn(),
            registerUser: jest.fn(),
            registerLoginAccess: jest.fn(),
            deactivateUserForInactivity: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should throw NotFoundExpection if user is not found', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(authService.login('7081545', 'pedro132')).rejects.toThrow(
        new UnauthorizedException('Usuário ou senha inválidos'),
      );
    });

    it('should throw UnauthorizedExpection if password is incorrect', async () => {
      jest
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User(loginUser));
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login('username', 'wrong_password'),
      ).rejects.toThrow(
        new UnauthorizedException('Usuário ou senha inválidos'),
      );
    });

    it('should throw BadRequestException if user is not active', async () => {
      jest
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User({ ...loginUser, ativo: false }));

      await expect(authService.login('username', 'teste123')).rejects.toThrow(
        new BadRequestException('Usuário está inativo no sistema'),
      );
    });

    it('should deactivate the user and refuse login after 60 days without access', async () => {
      const oldAccess = new Date(fixedDate);
      oldAccess.setDate(oldAccess.getDate() - 61);

      jest.spyOn(usersService, 'findUser').mockResolvedValue(
        new User({
          ...loginUser,
          ultimo_acesso: oldAccess,
        }),
      );
      (compare as jest.Mock).mockResolvedValue(true);

      await expect(authService.login('username', 'teste123')).rejects.toThrow(
        new BadRequestException(
          'Conta desativada por falta de acesso há mais de 60 dias. Procure um administrador.',
        ),
      );
    });

    it('should return user and access_token if login is successful', async () => {
      const access_token = 'jwt_token';

      jest
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User(loginUser));
      (compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(access_token);

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
      expect(usersService.registerLoginAccess).toHaveBeenCalledTimes(1);
    });
  });
});
