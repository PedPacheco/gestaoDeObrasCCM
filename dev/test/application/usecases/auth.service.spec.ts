import { compare, genSalt, hash } from 'bcrypt';
import { AuthService } from 'src/application/usecases/auth.service';
import { EmailService } from 'src/application/usecases/email.service';
import { UsersService } from 'src/application/usecases/users.service';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';
import { AUTH_REPOSITORY } from 'src/domain/repositories/IAuthRepository';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import { generateRandomPassword } from 'src/utils/generatePassword';

import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

const mockAuthRepository = {
  register: jest.fn(),
};

jest.mock('src/utils/generatePassword');

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
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findUser: jest.fn(),
            registerUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
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
      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(authService.login('7081545', 'pedro132')).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should throw UnauthorizedExpection if password is incorrect', async () => {
      jest
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User(loginUser));
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login('username', 'wrong_password'),
      ).rejects.toThrow(new UnauthorizedException('Senha incorreta'));
    });

    it('should throw BadRequestException if user is not active', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue({
        ...loginUser,
        ativo: false,
      } as User);

      await expect(authService.login('username', 'teste123')).rejects.toThrow(
        new BadRequestException('Usuário está inativo no sistema'),
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
    });
  });

  describe('register', () => {
    it('should throw BadRequestExpection when user already exists', async () => {
      jest
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User(loginUser));

      await expect(authService.register(loginUser)).rejects.toThrow(
        new BadRequestException('Nome de usuário já está em uso.'),
      );
    });

    it('should throw BadRequestExpection the internal user does not have a defined area.', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

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

      jest.spyOn(usersService, 'findUser').mockResolvedValue(
        new User({
          ...registerUser,
          tipo_usuario: TipoUsuario.PARCEIRA,
          ativo: true,
        }),
      );

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

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

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      const user = new User({
        ...registerUser,
        senha: hashedPassword,
        ativo: true,
      });

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);
      mockAuthRepository.register.mockResolvedValue(user);
      (generateRandomPassword as jest.Mock).mockReturnValue('hashPassword');

      const result = await authService.register(registerUser);

      expect(result).toEqual(user);
    });
  });
});
