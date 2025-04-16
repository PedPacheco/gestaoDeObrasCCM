import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import { USER_REPOSITORY } from 'src/domain/repositories/IUserRepository';
import { UsersService } from 'src/domain/services/users.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

describe('VisualizationGuard', () => {
  let usersService: UsersService;
  let visualizationGuard: VisualizationGuard;

  const mockUserRepository = {
    findUser: jest.fn(),
    updatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VisualizationGuard,
        UsersService,
        PrismaService,
        JwtService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    visualizationGuard = module.get<VisualizationGuard>(VisualizationGuard);
  });

  it('Should VirsualizationGuard is defined', () => {
    expect(visualizationGuard).toBeDefined();
  });

  it('Should be throw error if user is not found in request', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    await expect(visualizationGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Usuário não autenticado'),
    );
  });

  it('Should be throw error if user is not found in the UsersService method', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { username: 'teste' },
        }),
      }),
    } as unknown as ExecutionContext;

    const request = context.switchToHttp().getRequest();

    const spyUsersService = jest
      .spyOn(usersService, 'findUser')
      .mockResolvedValue(null);

    await expect(visualizationGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Usuário não encontrado'),
    );
    expect(spyUsersService).toHaveBeenCalledWith(request.user.username);
  });

  it('Should be add property in object query with value of the user idRegional', async () => {
    const mockRequest = {
      user: {
        username: 'teste',
        permissao: 'Total',
        permissao_visualizacao: 'parcial',
      },
      query: {},
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const user = {
      id: 1,
      username: 'teste',
      senha: 'hashPassword',
      permissao: 'Total',
      id_regional: 1,
      permissao_visualizacao: 'parcial',
      formulario_utilizado: null,
      nome_maquina: null,
      nome_usuario: null,
      email: null,
    };

    const request = context.switchToHttp().getRequest();

    const spyUsersService = jest
      .spyOn(usersService, 'findUser')
      .mockResolvedValue(user);

    const result = await visualizationGuard.canActivate(context);

    expect(request.query.idRegional).toEqual(user.id_regional);
    expect(spyUsersService).toHaveBeenCalledWith(request.user.username);
    expect(result).toBe(true);
  });
});
