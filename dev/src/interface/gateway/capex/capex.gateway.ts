import { Logger, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { isUUID } from 'class-validator';
import { Namespace, Socket } from 'socket.io';
import { CapexProgressPayload } from 'src/application/shared/capex.types';
import {
  extractTokenFromSocket,
  isPayloadExpired,
} from 'src/core/guards/wsAuth.util';

const FINISHED_TTL_MS = 10 * 60_000; // após done/error: tempo para o cliente reconectar
const IDLE_TTL_MS = 2 * 60 * 60_000; // sem eventos durante 2 h: job considerado abandonado

export interface CapexProgressEvent extends CapexProgressPayload {
  jobId: string;
}

interface JobCache {
  ownerId: string;
  finished: boolean;
  lastState?: CapexProgressEvent;
  cleanupTimer?: ReturnType<typeof setTimeout>;
}

/** Ajuste ao campo de identificação do utilizador no payload do JWT */
export const getUserId = (user: any): string => {
  const id = user?.id ?? user?.sub;
  if (id === undefined || id === null) {
    throw new Error('JWT sem identificador de usuário');
  }
  return String(id);
};

/**
 * Gateway único para os fluxos do CAPEX (importação e atualização).
 *
 * Fluxo do cliente:
 *  1. Liga-se ao namespace /socketCapex com auth: { token }
 *  2. POST /base-auxiliar/capex/pipeline, recebe { jobId }
 *  3. Emite 'join' com o jobId e recebe de imediato o último estado (replay)
 *  4. Escuta 'capex:progress' até phase 'done' ou 'error'
 *
 * Autorização: quem cria o job já passou pelos guards HTTP (área/permissão de
 * edição). No WS basta provar que o socket é dono do job (ou admin), por isso
 * o 'join' NÃO usa os guards de área, que foram escritos para HTTP.
 */
// Eventos de WebSocket não devem consumir o limite de requisições HTTP do
// ThrottlerGuard global (feito para HTTP). Defensivo: no @nestjs/throttler 6.7
// o guard não interfere nos eventos, mas versões anteriores assumem HTTP.
// O CORS do socket é resolvido em tempo de execução pelo SocketIoAdapter.
@SkipThrottle()
@WebSocketGateway({ namespace: '/socketCapex' })
export class CapexGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  private readonly logger = new Logger(CapexGateway.name);
  private readonly jobCache = new Map<string, JobCache>();

  @WebSocketServer()
  private readonly server: Namespace;

  constructor(private readonly jwtService: JwtService) {}

  // ─── Autenticação na ligação ─────────────────────────────────────
  afterInit(server: Namespace) {
    server.use(async (socket, next) => {
      const token = extractTokenFromSocket(socket);
      if (!token) return next(new Error('Não autorizado'));
      try {
        socket.data.user = await this.jwtService.verifyAsync(token);
        next();
      } catch {
        next(new Error('Token inválido ou expirado')); // chega ao cliente em 'connect_error'
      }
    });
  }

  handleConnection(client: Socket) {
    this.logger.debug(`WS conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS desconectado: ${client.id}`);
  }

  // ─── Eventos do cliente ──────────────────────────────────────────
  @SubscribeMessage('join')
  handleJoin(@MessageBody() jobId: unknown, @ConnectedSocket() client: Socket) {
    const user = client.data.user;

    // O socket continua ligado depois de o JWT expirar: verifica o exp a cada join.
    if (!user || isPayloadExpired(user)) {
      throw new WsException('Sessão expirada');
    }

    if (typeof jobId !== 'string' || !isUUID(jobId, 4)) {
      throw new WsException('jobId inválido');
    }

    const job = this.jobCache.get(jobId);
    if (!job) {
      throw new WsException('Job não encontrado ou expirado');
    }

    if (!user.is_admin && job.ownerId !== getUserId(user)) {
      throw new WsException('Sem acesso a este job');
    }

    client.join(jobId);
    this.logger.debug(`Client ${client.id} entrou no room ${jobId}`);

    if (job.lastState) {
      client.emit('capex:progress', job.lastState);
    }

    return { joined: jobId }; // ack para o cliente
  }

  // ─── API interna ─────────────────────────────────────────────────
  /** Regista o job e o seu dono. Deve ser chamado antes de devolver o jobId ao cliente. */
  createEmitter(jobId: string, ownerId: string | number) {
    this.jobCache.set(jobId, { ownerId: String(ownerId), finished: false });
    this.scheduleCleanup(jobId, IDLE_TTL_MS);
    return (payload: CapexProgressPayload) => this.emitProgress(jobId, payload);
  }

  emitProgress(jobId: string, payload: CapexProgressPayload): void {
    const job = this.jobCache.get(jobId);
    // Estado terminal é final: eventos tardios ou duplicados são ignorados.
    if (!job || job.finished) return;

    const isError = payload.phase === 'error';
    const finished = isError || payload.phase === 'done';
    const previous = job.lastState?.percentage ?? 0;

    // Erro mantém o último percentual; o progresso nunca regride (rede de segurança).
    const percentage = isError
      ? previous
      : Math.min(100, Math.max(previous, payload.percentage));

    const event: CapexProgressEvent = { jobId, ...payload, percentage };
    job.lastState = event;
    job.finished = finished;
    this.scheduleCleanup(jobId, finished ? FINISHED_TTL_MS : IDLE_TTL_MS);

    this.server.to(jobId).emit('capex:progress', event);
  }

  onModuleDestroy() {
    for (const job of this.jobCache.values()) clearTimeout(job.cleanupTimer);
    this.jobCache.clear();
  }

  // ─── Cache ───────────────────────────────────────────────────────
  private scheduleCleanup(jobId: string, ms: number): void {
    const job = this.jobCache.get(jobId);
    if (!job) return;

    if (job.cleanupTimer) clearTimeout(job.cleanupTimer);
    job.cleanupTimer = setTimeout(() => this.jobCache.delete(jobId), ms);
    job.cleanupTimer.unref?.(); // não impede o processo de terminar
  }
}
