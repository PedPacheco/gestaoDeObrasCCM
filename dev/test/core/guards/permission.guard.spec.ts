import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';

// Mock do utilitário
jest.mock('src/utils/convertParameterValue', () => ({
  convertParameterValue: jest.fn((value: string) => Number(value)),
}));

const createMockExecutionContext = (user: any): ExecutionContext => {
  const request = { user } as any;

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
};

describe('AreaPermissionGuards', () => {
  // ─────────────────────────────────────────────
  // validateBasePermissions (testado via guards)
  // ─────────────────────────────────────────────
  describe('validateBasePermissions', () => {
    it('should throw ForbiddenException when user is null', async () => {
      const Guard = AreaViewGuard();
      const guard = new Guard();
      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Usuário não autenticado'),
      );
    });

    it('should throw ForbiddenException when user is undefined', async () => {
      const Guard = AreaViewGuard();
      const guard = new Guard();
      const context = createMockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Usuário não autenticado'),
      );
    });

    it('should throw ForbiddenException when adminOnly is true and user is not admin', async () => {
      const Guard = AreaViewGuard({ adminOnly: true });
      const guard = new Guard();
      const user = { is_admin: false, tipo_usuario: 'INTERNO', id_area: 1 };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'Apenas administradores podem acessar este recurso',
        ),
      );
    });

    it('should allow access when adminOnly is true and user is admin', async () => {
      const Guard = AreaViewGuard({ adminOnly: true });
      const guard = new Guard();
      const user = { is_admin: true, tipo_usuario: 'INTERNO', id_area: 1 };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should allow access when user is admin (bypasses all other checks)', async () => {
      const Guard = AreaViewGuard({
        allowedAreas: [1],
        blockPartner: true,
      });
      const guard = new Guard();
      const user = { is_admin: true, tipo_usuario: 'PARCEIRA', id_area: 99 };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should throw ForbiddenException when blockPartner is true and user is PARCEIRA', async () => {
      const Guard = AreaViewGuard({ blockPartner: true });
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'PARCEIRA',
        id_turma: 10,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'Usuários parceiros não têm acesso a este recurso',
        ),
      );
    });

    it('should throw ForbiddenException when INTERNO user has no id_area', async () => {
      const Guard = AreaViewGuard();
      const guard = new Guard();
      const user = { is_admin: false, tipo_usuario: 'INTERNO', id_area: null };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Usuário interno sem área vinculada'),
      );
    });

    it('should throw ForbiddenException when INTERNO user area is not in allowedAreas', async () => {
      const Guard = AreaViewGuard({ allowedAreas: [1, 2, 3] });
      const guard = new Guard();
      const user = { is_admin: false, tipo_usuario: 'INTERNO', id_area: 5 };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Sua área não possui acesso a este recurso'),
      );
    });

    it('should allow INTERNO user when area is in allowedAreas', async () => {
      const Guard = AreaViewGuard({ allowedAreas: [1, 2, 3] });
      const guard = new Guard();
      const user = { is_admin: false, tipo_usuario: 'INTERNO', id_area: 2 };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should allow INTERNO user when allowedAreas is empty', async () => {
      const Guard = AreaViewGuard({ allowedAreas: [] });
      const guard = new Guard();
      const user = { is_admin: false, tipo_usuario: 'INTERNO', id_area: 99 };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should use default options when none are provided', async () => {
      const Guard = AreaViewGuard();
      const guard = new Guard();
      const user = { is_admin: false, tipo_usuario: 'INTERNO', id_area: 5 };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // AreaViewGuard
  // ─────────────────────────────────────────────
  describe('AreaViewGuard', () => {
    it('should set idParceira on request when user is PARCEIRA', async () => {
      const Guard = AreaViewGuard();
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'PARCEIRA',
        id_turma: 42,
      };
      const request = { user } as any;

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.idParceira).toBe(42);
    });

    it('should not set idParceira when user is INTERNO', async () => {
      const Guard = AreaViewGuard();
      const guard = new Guard();
      const user = { is_admin: false, tipo_usuario: 'INTERNO', id_area: 1 };
      const request = { user } as any;

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      await guard.canActivate(context);

      expect(request.idParceira).toBeUndefined();
    });

    it('should not set idParceira when user is admin', async () => {
      const Guard = AreaViewGuard();
      const guard = new Guard();
      const user = { is_admin: true, tipo_usuario: 'INTERNO', id_area: 1 };
      const request = { user } as any;

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      await guard.canActivate(context);

      expect(request.idParceira).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────
  // AreaEditGuard
  // ─────────────────────────────────────────────
  describe('AreaEditGuard', () => {
    it('should throw ForbiddenException when user is null', async () => {
      const Guard = AreaEditGuard();
      const guard = new Guard();
      const context = createMockExecutionContext(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Usuário não autenticado'),
      );
    });

    it('should allow access when user is admin', async () => {
      const Guard = AreaEditGuard();
      const guard = new Guard();
      const user = {
        is_admin: true,
        tipo_usuario: 'INTERNO',
        id_area: 8,
        permissao_edicao: false,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should throw ForbiddenException when area 8 user has no edit permission', async () => {
      const Guard = AreaEditGuard();
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'INTERNO',
        id_area: 8,
        permissao_edicao: false,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'Usuário da área de construção sem permissão de edição',
        ),
      );
    });

    it('should allow access when area 8 user has edit permission', async () => {
      const Guard = AreaEditGuard();
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'INTERNO',
        id_area: 8,
        permissao_edicao: true,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should allow access when INTERNO user is not in area 8', async () => {
      const Guard = AreaEditGuard();
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'INTERNO',
        id_area: 3,
        permissao_edicao: false,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should allow access for PARCEIRA user when blockPartner is false', async () => {
      const Guard = AreaEditGuard();
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'PARCEIRA',
        id_turma: 5,
        permissao_edicao: false,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('should throw ForbiddenException when blockPartner is true and user is PARCEIRA', async () => {
      const Guard = AreaEditGuard({ blockPartner: true });
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'PARCEIRA',
        id_turma: 5,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'Usuários parceiros não têm acesso a este recurso',
        ),
      );
    });

    it('should throw ForbiddenException when adminOnly and user is not admin', async () => {
      const Guard = AreaEditGuard({ adminOnly: true });
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'INTERNO',
        id_area: 1,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException(
          'Apenas administradores podem acessar este recurso',
        ),
      );
    });

    it('should throw ForbiddenException when INTERNO user has no id_area', async () => {
      const Guard = AreaEditGuard();
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'INTERNO',
        id_area: undefined,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Usuário interno sem área vinculada'),
      );
    });

    it('should throw ForbiddenException when INTERNO user area is not in allowedAreas', async () => {
      const Guard = AreaEditGuard({ allowedAreas: [1, 2] });
      const guard = new Guard();
      const user = {
        is_admin: false,
        tipo_usuario: 'INTERNO',
        id_area: 5,
      };
      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new ForbiddenException('Sua área não possui acesso a este recurso'),
      );
    });
  });
});
