import { PermissionGuard } from 'src/core/guards/permission.guard';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

describe('PermissionGuard', () => {
  let permissionGuard: PermissionGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PermissionGuard, PrismaService, JwtService],
    }).compile();

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

  it('should be throw an error if the user has the permission_view field equal to partial', async () => {
    const mockRequest = {
      user: {
        username: 'teste',
        permissao: 'Total',
        permissao_visualizacao: 'parcial',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(permissionGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException(
        'Usuário não tem permissão para acessar está página',
      ),
    );
  });

  it('should be return true if the user has the permission_view field equal to total', async () => {
    const mockRequest = {
      user: {
        username: 'teste',
        permissao: 'Total',
        permissao_visualizacao: 'total',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = await permissionGuard.canActivate(context);

    expect(result).toBe(true);
  });
});
