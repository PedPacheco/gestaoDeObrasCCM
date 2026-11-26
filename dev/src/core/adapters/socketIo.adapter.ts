import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { getAllowedOrigins } from 'src/core/config/cors.config';

/**
 * Adapter do Socket.IO com CORS resolvido em tempo de execução.
 *
 * O decorator @WebSocketGateway({ cors }) é avaliado quando o arquivo é
 * importado, antes de o ConfigModule carregar o .env. Aqui o valor é lido
 * só quando o servidor é criado, e vale para todos os gateways.
 */
export class SocketIoAdapter extends IoAdapter {
  constructor(app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: getAllowedOrigins(), credentials: true },
    });
  }
}
