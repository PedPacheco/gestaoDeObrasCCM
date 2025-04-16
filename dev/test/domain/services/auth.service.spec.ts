import { compare, genSalt, hash } from 'bcrypt';
import { User } from 'src/domain/entities/user.entity';
import { AUTH_REPOSITORY } from 'src/domain/repositories/IAuthRepository';
import { AuthService } from 'src/domain/services/auth.service';
import { EmailService } from 'src/domain/services/email.service';
import { UsersService } from 'src/domain/services/users.service';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import { generateRandomPassword } from 'src/utils/generatePassword';

import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { usuario } from '@prisma/client';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

const mockAuthRepository = {
  register: jest.fn(),
};

jest.mock('src/utils/generatePassword');

const user: usuario = {
  id: 1,
  username: 'username',
  senha: 'teste123',
  email: 'teste@gmail.com',
  formulario_utilizado: null,
  id_regional: 1,
  nome_maquina: null,
  nome_usuario: 'teste',
  permissao: 'Total',
  permissao_visualizacao: 'parcial',
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let emailService: EmailService;

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
    emailService = module.get<EmailService>(EmailService);
  });

  describe('login', () => {
    it('should throw NotFoundExpection if user is not found', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(authService.login('7081545', 'pedro132')).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should throw UnauthorizedExpection if password is incorrect', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login('username', 'wrong_password'),
      ).rejects.toThrow(new UnauthorizedException('Senha incorreta'));
    });

    it('should return user and access_token if login is successful', async () => {
      const access_token = 'jwt_token';

      jest.spyOn(usersService, 'findUser').mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(access_token);

      const result = await authService.login('username', 'teste123');

      expect(result).toEqual({
        id: user.id,
        username: user.username,
        id_regional: user.id_regional,
        nome_usuario: user.nome_usuario,
        email: user.email,
        access_token: access_token,
      });
    });
  });

  describe('register', () => {
    it('should throw BadRequestExpection when user already exists', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(user);

      await expect(authService.register(user)).rejects.toThrow(
        new BadRequestException('Nome de usuário já está em uso.'),
      );
    });

    it('should create user and return user', async () => {
      const salt = 10;
      const hashedPassword = 'hashPassword';
      const registrationData: RegisterUserDTO = {
        username: 'teste123',
        permissao: 'total',
        id_regional: 1,
        email: 'teste@gmail.com',
        nome_usuario: 'Teste',
        permissao_visualizacao: 'parcial',
      };

      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      const user = new User({ ...registrationData, senha: hashedPassword });

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);
      mockAuthRepository.register.mockResolvedValue(user);
      (generateRandomPassword as jest.Mock).mockReturnValue('hashPassword');

      const result = await authService.register(registrationData);

      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      expect(result).toEqual(user);
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).toHaveBeenCalledWith(
        '10009591@edp.com.br',
        'Bem vindo ao sistema',
        expect.stringContaining(user.username),
      );
      expect(sendEmailSpy).toHaveBeenCalledWith(
        '10009591@edp.com.br',
        'Bem vindo ao sistema',
        expect.stringContaining(hashedPassword),
      );
    });
  });
});
