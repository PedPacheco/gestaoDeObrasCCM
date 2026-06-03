import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
  mixin,
} from '@nestjs/common';
import { convertParameterValue } from 'src/utils/convertParameterValue';

interface AreaPermissionOptions {
  allowedAreas?: number[];
  blockPartner?: boolean;
  adminOnly?: boolean;
}

function validateBasePermissions(
  user: any,
  options: AreaPermissionOptions,
): void {
  const {
    allowedAreas = [],
    blockPartner = false,
    adminOnly = false,
  } = options;

  if (!user) {
    throw new ForbiddenException('Usuário não autenticado');
  }

  if (adminOnly && !user.is_admin) {
    throw new ForbiddenException(
      'Apenas administradores podem acessar este recurso',
    );
  }

  if (user.is_admin) {
    return;
  }

  if (blockPartner && user.tipo_usuario === 'PARCEIRA') {
    throw new ForbiddenException(
      'Usuários parceiros não têm acesso a este recurso',
    );
  }

  if (user.tipo_usuario === 'INTERNO') {
    if (!user.id_area) {
      throw new ForbiddenException('Usuário interno sem área vinculada');
    }

    if (allowedAreas.length > 0 && !allowedAreas.includes(user.id_area)) {
      throw new ForbiddenException('Sua área não possui acesso a este recurso');
    }
  }
}

// Guard para endpoints de visualização
export function AreaViewGuard(
  options: AreaPermissionOptions = {},
): Type<CanActivate> {
  @Injectable()
  class AreaViewGuardMixin implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      validateBasePermissions(user, options);

      if (user.tipo_usuario === 'PARCEIRA') {
        request.idParceira = convertParameterValue(`${user.id_turma}`);
      }

      return true;
    }
  }

  return mixin(AreaViewGuardMixin);
}

export function AreaEditGuard(
  options: AreaPermissionOptions = {},
): Type<CanActivate> {
  @Injectable()
  class AreaEditGuardMixin implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      validateBasePermissions(user, options);

      // Admin já foi liberado no validateBasePermissions
      if (!user.is_admin && user.id_area === 8 && !user.permissao_edicao) {
        throw new ForbiddenException(
          'Usuário da área de construção sem permissão de edição',
        );
      }

      return true;
    }
  }

  return mixin(AreaEditGuardMixin);
}
