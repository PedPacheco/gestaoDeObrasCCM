import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (user.permissao_visualizacao === 'parcial') {
      throw new UnauthorizedException(
        'Usuário não tem permissão para acessar está página',
      );
    }

    return true;
  }
}
