import { Response } from 'express';
import { AuthService } from 'src/application/usecases/auth.service';
import { User } from 'src/domain/entities/user.entity';
import { AuthController } from 'src/interface/controllers/auth.controller';
import { LoginUserDTO } from 'src/interface/dtos/loginUserDto';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

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
        username: 'teste123',
        id_regional: 1,
        id_turma: 1,
        id_area: 8,
        is_admin: true,
        nome_usuario: 'Teste',
        tipo_usuario: 'INTERNO',
        permissao_edicao: true,
        email: 'teste@gmail.com',
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
          httpOnly: false,
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
          nome_usuario: mockResponse.nome_usuario,
          id_regional: mockResponse.id_regional,
          id_area: mockResponse.id_area,
          id_turma: mockResponse.id_turma,
          permissao_edicao: mockResponse.permissao_edicao,
          tipo_usuario: mockResponse.tipo_usuario,
          email: mockResponse.email,
          is_admin: mockResponse.is_admin,
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
        'Erro ao processar a solicitação',
      );
    });
  });

  describe('Register', () => {
    it('should call AuthService.register and return the result', async () => {
      const mockResponse = new User({
        id: 1,
        username: 'teste123',
        id_regional: 1,
        id_turma: 1,
        id_area: 8,
        is_admin: true,
        nome: 'Teste',
        tipo_usuario: 'INTERNO',
        permissao_edicao: true,
        email: 'teste@gmail.com',
      });

      const registerUserDTO: RegisterUserDTO = {
        username: 'teste123',
        id_regional: 1,
        id_turma: 1,
        id_area: 8,
        is_admin: true,
        nome: 'Teste',
        tipo_usuario: 'INTERNO',
        permissao_edicao: true,
        email: 'teste@gmail.com',
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
        id_turma: 1,
        id_area: 8,
        is_admin: true,
        nome: 'Teste',
        tipo_usuario: 'INTERNO',
        permissao_edicao: true,
        email: 'teste@gmail.com',
      };

      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(new Error('Erro ao processar a solicitação'));

      await expect(authController.register(registerUserDTO)).rejects.toThrow(
        'Erro ao processar a solicitação',
      );
    });
  });
});
