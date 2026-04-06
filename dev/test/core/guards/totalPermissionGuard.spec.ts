import { PrismaService } from 'src/infra/prisma/prisma.service';

import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { TotalPermissionGuard } from 'src/core/guards/totalPermission.guard';

describe('TotalPermissionGuard', () => {
  let totalPermissionGuard: TotalPermissionGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TotalPermissionGuard, PrismaService, JwtService],
    }).compile();

    totalPermissionGuard =
      module.get<TotalPermissionGuard>(TotalPermissionGuard);
  });

  it('Should TotalPermissionGuard is defined', () => {
    expect(totalPermissionGuard).toBeDefined();
  });

  it('Should be throw error if user is not found in request', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    await expect(totalPermissionGuard.canActivate(context)).rejects.toThrow(
      new UnauthorizedException('Usuário não autenticado'),
    );
  });

  it('should be throw an error if the user has the permission_view field equal to partial', async () => {
    const mockRequest = {
      user: {
        username: 'teste',
        permissao: 'Parcial',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    await expect(totalPermissionGuard.canActivate(context)).rejects.toThrow(
      new ForbiddenException(
        'Acesso permitido apenas para usuários com permissão total.',
      ),
    );
  });

  it('should return true if user permission equal "Total"', async () => {
    const mockRequest = {
      user: {
        username: 'teste',
        permissao: 'Total',
      },
    };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = await totalPermissionGuard.canActivate(context);

    expect(result).toBe(true);
  });
});
