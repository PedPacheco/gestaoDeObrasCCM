import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CapexProgressPayload } from 'src/application/shared/capex.types';

export interface CapexProgressEvent extends CapexProgressPayload {
  jobId: string;
}

interface JobCache {
  lastState: CapexProgressEvent;
  cleanupTimer?: ReturnType<typeof setTimeout>;
}

/**
 * Gateway único para os dois fluxos do CAPEX (importação e atualização).
 *
 * Resolve a condição de corrida entre HTTP e WS:
 * O gateway mantém o último estado emitido por jobId em cache.
 * Quando o cliente faz 'join' — mesmo após eventos já emitidos —
 * recebe imediatamente o estado atual, sem perder progresso.
 *
 * Fluxo do cliente (igual para fluxos separados e único):
 *   1. POST /base-auxiliar/capex  ou  POST /obras/atualizar-capex
 *   2. Recebe { jobId } no corpo da resposta 202
 *   3. Conecta ao namespace /capex  (pode ser feito antes do POST também)
 *   4. Emite 'join' com o jobId recebido
 *   5. Escuta 'capex:progress' — recebe replay imediato se já houve eventos
 *   6. Ao receber status 'done' ou 'error', desconecta
 */
@WebSocketGateway({
  namespace: '/socketCapex',
  cors: { origin: process.env.CORS_ORIGIN ?? '*' },
})
export class CapexGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly logger = new Logger(CapexGateway.name);

  /**
   * Cache do último estado emitido por jobId.
   * Permite replay imediato para clientes que conectam após o início do job.
   * TTL de limpeza: 10 minutos após conclusão (done/error).
   */
  private readonly jobCache = new Map<string, JobCache>();

  // ─── Lifecycle ────────────────────────────────────────────────────

  handleConnection(client: Socket): void {
    this.logger.debug(`WS conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`WS desconectado: ${client.id}`);
  }

  // ─── Eventos do cliente ───────────────────────────────────────────

  /**
   * Cliente entra no room isolado do jobId.
   *
   * Se o job já tiver estado em cache (cliente conectou tarde),
   * o último estado é reenviado imediatamente para esse cliente.
   * Isso garante que o frontend nunca fique com a barra de progresso
   * parada em 0% caso haja alguma latência na conexão WS.
   */
  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() jobId: string,
    @ConnectedSocket() client: Socket,
  ): void {
    client.join(jobId);
    this.logger.debug(`Client ${client.id} entrou no room ${jobId}`);

    const cached = this.jobCache.get(jobId);
    if (cached) {
      client.emit('capex:progress', cached.lastState);
      this.logger.debug(
        `Replay de estado para ${client.id}: phase=${cached.lastState.phase} %${cached.lastState.percentage}`,
      );
    }
  }

  // ─── API interna (usada pelos serviços via createEmitter) ─────────

  /**
   * Emite o evento de progresso para todos os clientes do room
   * e atualiza o cache interno do job.
   */
  emitProgress(jobId: string, payload: CapexProgressPayload): void {
    const event: CapexProgressEvent = { jobId, ...payload };

    this.updateCache(jobId, event);
    this.server.to(jobId).emit('capex:progress', event);
  }

  /**
   * Retorna um ProgressEmitter já vinculado ao jobId.
   * É o que os controllers injetam nos serviços — mantém os serviços
   * completamente agnósticos ao gateway e ao protocolo WS.
   */
  createEmitter(jobId: string) {
    return (payload: CapexProgressPayload) => this.emitProgress(jobId, payload);
  }

  // ─── Cache helpers ────────────────────────────────────────────────

  private updateCache(jobId: string, event: CapexProgressEvent): void {
    const existing = this.jobCache.get(jobId);

    // Cancela timer anterior para evitar limpeza prematura em jobs lentos
    if (existing?.cleanupTimer) {
      clearTimeout(existing.cleanupTimer);
    }

    const entry: JobCache = { lastState: event };

    // Agenda limpeza do cache somente quando o job termina
    if (event.phase === 'done' || event.phase === 'error') {
      entry.cleanupTimer = setTimeout(
        () => this.jobCache.delete(jobId),
        10 * 60 * 1_000, // 10 min: tempo suficiente para o cliente reconectar se necessário
      );
    }

    this.jobCache.set(jobId, entry);
  }
}
