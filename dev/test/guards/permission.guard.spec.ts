import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PermissionGuard } from 'src/common/guards/permission.guard';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { UsersService } from 'src/modules/users/users.service';

describe('PermissionGuard', () => {
  let usersService: UsersService;
  let permissionGuard: PermissionGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PermissionGuard, UsersService, PrismaService, JwtService],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    permissionGuard = module.get<PermissionGuard>(PermissionGuard);
  });

  it('Should PermissionGuard is defined', () => {
    expect(permissionGuard).toBeDefined();
  });

  it('Should be throw error if user is not found in request', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    await expect(permissionGuard.canActivate(context)).rejects.toThrow(
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

    await expect(permissionGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Usuário não encontrado'),
    );
    expect(spyUsersService).toHaveBeenCalledWith(request.user.username);
  });

  it('Should be add property in object query with value of the user idRegional', async () => {
    const mockRequest = {
      user: { username: 'teste' },
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

    const result = await permissionGuard.canActivate(context);

    expect(request.query.idRegional).toEqual(user.id_regional);
    expect(spyUsersService).toHaveBeenCalledWith(request.user.username);
    expect(result).toBe(true);
  });
});
