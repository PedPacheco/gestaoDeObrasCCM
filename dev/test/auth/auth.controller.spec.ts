import { RegisterUserDTO } from 'src/config/dto/registerUserDto';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginUserDTO } from 'src/config/dto/loginUserDto';
import { AuthController } from 'src/modules/auth/auth.controller';
import { AuthService } from 'src/modules/auth/auth.service';
import { ResetPasswordDTO } from 'src/config/dto/resetPasswordDto';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            sendEmailResetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('should call AuthService.login and return the result', async () => {
      const loginDto: LoginUserDTO = {
        user: 'testuser',
        password: 'password',
      };

      const mockResponse = {
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
        access_token: 'token',
      };

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      jest.spyOn(authService, 'login').mockResolvedValue(mockResponse);

      const result = await authController.login(loginDto, res);

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.user,
        loginDto.password,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        mockResponse.access_token,
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
        },
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Login realizado com sucesso',
        data: {
          id: mockResponse.id,
          username: mockResponse.username,
          permissao: mockResponse.permissao,
          id_regional: mockResponse.id_regional,
          nome_usuario: mockResponse.nome_usuario,
          email: mockResponse.email,
        },
      });
    });

    it('Should return internal Server error if authService.login return error', async () => {
      const loginDto: LoginUserDTO = {
        user: 'testuser',
        password: 'password',
      };

      const res = {
        cookie: jest.fn(),
      } as unknown as Response;

      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(new Error('Erro ao processar a solicitação'));

      await expect(authController.login(loginDto, res)).rejects.toThrow(
        new InternalServerErrorException('Erro ao processar a solicitação'),
      );
    });
  });

  describe('Register', () => {
    it('should call AuthService.register and return the result', async () => {
      const mockResponse = {
        id: 1,
        username: 'teste123',
      };

      const registerUserDTO: RegisterUserDTO = {
        username: 'teste123',
        id_regional: 1,
        permissao: 'total',
        email: 'teste@gmail.com',
        nome_usuario: 'Teste',
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);

      const result = await authController.register(registerUserDTO);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Usuário cadastrado com sucesso',
        data: {
          id: mockResponse.id,
          username: mockResponse.username,
        },
      });
      expect(authService.register).toHaveBeenCalledWith(registerUserDTO);
    });

    it('should return internal server error if authService.register return error', async () => {
      const registerUserDTO: RegisterUserDTO = {
        username: 'teste123',
        id_regional: 1,
        permissao: 'total',
        email: 'teste@gmail.com',
        nome_usuario: 'Teste',
      };

      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(new Error('Erro ao processar a solicitação'));

      await expect(authController.register(registerUserDTO)).rejects.toThrow(
        new InternalServerErrorException('Erro ao processar a solicitação'),
      );
    });
  });

  describe('ResetPassword', () => {
    it('should call authService.resetPassword', async () => {
      const user: ResetPasswordDTO = { username: 'teste' };

      const spy = jest
        .spyOn(authService, 'sendEmailResetPassword')
        .mockResolvedValue(undefined);

      await authController.resetPassword(user);

      expect(spy).toHaveBeenCalledWith(user.username);
      expect(spy).toHaveBeenCalled();
    });

    it('should return internal server error if authService.register return error', async () => {
      const user: ResetPasswordDTO = { username: 'teste' };

      jest
        .spyOn(authService, 'sendEmailResetPassword')
        .mockRejectedValue(new Error('Erro ao processar a solicitação'));

      await expect(authController.resetPassword(user)).rejects.toThrow(
        new InternalServerErrorException('Erro ao processar a solicitação'),
      );
    });
  });
});
