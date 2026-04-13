import { UsersService } from 'src/application/usecases/users.service';
import { convertParameterValue } from 'src/utils/convertParameterValue';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class VisualizationGuard implements CanActivate {
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

    if (user.permissao_visualizacao === 'parcial') {
      request.idParceira = convertParameterValue(`${userRecord.id_turma}`);
      request.insufficientPermission = true;
    }

    return true;
  }
}
