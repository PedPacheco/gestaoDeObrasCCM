import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Type,
  mixin,
} from '@nestjs/common';

const ADMIN_PANEL_USERNAMES = ['6364B', '169337', '10009591'];

export function AdminPanelGuard(): Type<CanActivate> {
  @Injectable()
  class AdminPanelGuardMixin implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      if (!user) {
        throw new ForbiddenException('Usuário não autenticado');
      }

      if (!ADMIN_PANEL_USERNAMES.includes(user.username)) {
        throw new ForbiddenException('Você não tem acesso a este recurso');
      }

      return true;
    }
  }

  return mixin(AdminPanelGuardMixin);
}
