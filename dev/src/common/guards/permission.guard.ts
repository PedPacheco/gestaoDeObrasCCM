import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private userService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    const userRecord = await this.userService.findUser(user.username);

    if (!userRecord) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (userRecord.permissao_visualizacao === 'parcial') {
      request.query.idRegional = userRecord.id_regional;
    }

    return true;
  }
}
