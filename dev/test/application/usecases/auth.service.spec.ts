import { compare, genSalt, hash } from 'bcrypt';
import { AuthService } from 'src/application/usecases/auth.service';
import { EmailService } from 'src/application/usecases/email.service';
import { UsersService } from 'src/application/usecases/users.service';
import { User } from 'src/domain/entities/user.entity';
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
import { novo_tabela_usuarios } from '@prisma/client';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

const mockAuthRepository = {
  register: jest.fn(),
};

jest.mock('src/utils/generatePassword');

const user: novo_tabela_usuarios = {
  id: 1,
  username: 'username',
  senha: 'teste123',
  nome: 'test',
  email: 'teste@gmail.com',
  id_regional: 1,
  id_turma: 2,
  id_area: 8,
  is_admin: true,
  tipo_usuario: 'INTERNO',
  permissao_edicao: true,
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  // let emailService: EmailService;

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
    // emailService = module.get<EmailService>(EmailService);
  });

  describe('login', () => {
    it('should throw NotFoundExpection if user is not found', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(authService.login('7081545', 'pedro132')).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should throw UnauthorizedExpection if password is incorrect', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(new User(user));
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login('username', 'wrong_password'),
      ).rejects.toThrow(new UnauthorizedException('Senha incorreta'));
    });

    it('should return user and access_token if login is successful', async () => {
      const access_token = 'jwt_token';

      jest.spyOn(usersService, 'findUser').mockResolvedValue(new User(user));
      (compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(access_token);

      const result = await authService.login('username', 'teste123');

      expect(result).toEqual({
        id: user.id,
        id_area: user.id_area,
        id_turma: user.id_turma,
        id_regional: user.id_regional,
        is_admin: user.is_admin,
        permissao_edicao: user.permissao_edicao,
        tipo_usuario: user.tipo_usuario,
        username: user.username,
        nome_usuario: user.nome,
        email: user.email,
        access_token: access_token,
      });
    });
  });

  describe('register', () => {
    it('should throw BadRequestExpection when user already exists', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(new User(user));

      await expect(authService.register(user)).rejects.toThrow(
        new BadRequestException('Nome de usuário já está em uso.'),
      );
    });

    it('should throw BadRequestExpection the internal user does not have a defined area.', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(
        authService.register({ ...user, id_area: undefined }),
      ).rejects.toThrow(
        new BadRequestException(
          'Usuários internos devem possuir uma área vinculada.',
        ),
      );
    });

    it('should be set the partner user area to null', async () => {
      const salt = 10;
      const hashedPassword = 'hashPassword';

      jest
        .spyOn(usersService, 'findUser')
        .mockResolvedValue(new User({ ...user, tipo_usuario: 'PARCEIRA' }));

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      await authService.register({
        ...user,
        senha: hashedPassword,
        tipo_usuario: 'PARCEIRA',
      });

      expect(mockAuthRepository.register).toHaveBeenCalledWith({
        ...user,
        senha: hashedPassword,
        id_area: null,
        tipo_usuario: 'PARCEIRA',
      });
    });

    it('should create user and return user', async () => {
      const salt = 10;
      const hashedPassword = 'hashPassword';
      const registrationData: RegisterUserDTO = {
        id_regional: 1,
        id_turma: 1,
        id_area: 8,
        is_admin: true,
        tipo_usuario: 'INTERNO',
        permissao_edicao: true,
        username: 'teste123',
        email: 'teste@gmail.com',
        nome: 'Teste',
      };

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      const user = new User({ ...registrationData, senha: hashedPassword });

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);
      mockAuthRepository.register.mockResolvedValue(user);
      (generateRandomPassword as jest.Mock).mockReturnValue('hashPassword');

      const result = await authService.register(registrationData);

      // const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      expect(result).toEqual(user);
      // expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      // expect(sendEmailSpy).toHaveBeenCalledWith(
      //   '10009591@edp.com.br',
      //   'Bem vindo ao sistema',
      //   expect.stringContaining(user.username),
      // );
      // expect(sendEmailSpy).toHaveBeenCalledWith(
      //   '10009591@edp.com.br',
      //   'Bem vindo ao sistema',
      //   expect.stringContaining(hashedPassword),
      // );
    });
  });
});
