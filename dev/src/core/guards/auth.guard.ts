import { Request } from 'express';
import { Socket } from 'socket.io';
import { IS_PUBLIC_KEY } from 'src/shared/costants';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { extractTokenFromSocket, isPayloadExpired } from './wsAuth.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Guards globais (APP_GUARD) também rodam nos handlers de gateway.
    // Sem este ramo, o request "HTTP" seria o Socket e todo evento WS
    // falharia com UnauthorizedException.
    if (context.getType() === 'ws') {
      return this.canActivateWs(context);
    }

    // ---------- HTTP (comportamento inalterado) ----------
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  // ---------- WebSocket ----------
  private async canActivateWs(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    let user = client.data?.user;

    // O middleware do gateway normalmente já autenticou o socket;
    // aqui é só o plano B caso ele não tenha rodado.
    if (!user) {
      const token = extractTokenFromSocket(client);
      if (!token) throw new WsException('Não autorizado');

      try {
        user = await this.jwtService.verifyAsync(token);
      } catch {
        throw new WsException('Token inválido ou expirado');
      }
      client.data.user = user;
    }

    if (isPayloadExpired(user)) {
      throw new WsException('Sessão expirada');
    }

    return true;
  }
}
