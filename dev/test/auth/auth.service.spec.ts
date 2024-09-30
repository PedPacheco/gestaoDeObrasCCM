import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from 'src/users/users.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import { RegisterUserDTO } from 'src/config/dto/registerUserDto';
import { EmailService } from 'src/modules/email/email.service';
import { usuario } from '@prisma/client';
import { generateRandomPassword } from 'src/utils/generatePassword';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

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
        permissao: user.permissao,
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
      const user: RegisterUserDTO = {
        username: 'teste123',
        id_regional: 1,
        permissao: 'total',
        nome_usuario: 'Teste',
        email: 'teste@gmail.com',
      };

      (genSalt as jest.Mock).mockResolvedValue(salt);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);
      jest.spyOn(usersService, 'registerUser').mockResolvedValue({
        id: 1,
        username: user.username,
      });
      (generateRandomPassword as jest.Mock).mockReturnValue('hashPassword');

      const result = await authService.register({
        ...user,
      });

      const sendEmailSpy = jest.spyOn(emailService, 'sendEmail');

      expect(result).toEqual({
        id: 1,
        username: user.username,
      });
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).toHaveBeenCalledWith(
        user.email,
        'Bem vindo ao sistema',
        expect.stringContaining(user.username),
      );
      expect(sendEmailSpy).toHaveBeenCalledWith(
        user.email,
        'Bem vindo ao sistema',
        expect.stringContaining(hashedPassword),
      );
    });
  });

  describe('ResetPassword', () => {
    it('should return NotFoundExpection if user is not found', async () => {
      jest.spyOn(usersService, 'findUser').mockResolvedValue(null);

      await expect(authService.resetPassword('teste')).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('should create a token and send email to change user password', async () => {
      const jwtToken = 'jwt_token';
      const resetLink = `http://localhost:3000/reset-password?token=${jwtToken}`;

      jest.spyOn(usersService, 'findUser').mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue(jwtToken);
      const spyEmail = jest.spyOn(emailService, 'sendEmail');

      await authService.resetPassword(user.username);

      expect(spyEmail).toHaveBeenCalledTimes(1);
      expect(spyEmail).toHaveBeenCalledWith(
        user.email,
        'Redefinição de senha',
        `Clique no link abaixo para redefinir sua senha: ${resetLink}`,
      );
    });
  });
});
