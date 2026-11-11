// src/core/interceptors/cleanupUploadsOnError.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { unlink } from 'fs/promises';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';

/** Todos os ficheiros gravados em disco neste pedido (FileInterceptor, FilesInterceptor ou FileFieldsInterceptor). */
export function collectUploadedFiles(req: Request): Express.Multer.File[] {
  const files = req.files;
  const list = [
    ...(req.file ? [req.file] : []),
    ...(Array.isArray(files) ? files : Object.values(files ?? {}).flat()),
  ];
  return list.filter((file) => !!file?.path); // memoryStorage não tem path
}

/**
 * Se o pedido falhar, apaga os uploads acabados de gravar e relança o erro original.
 * Usar SÓ em rotas em que nada pode falhar depois do commit na base de dados.
 */
@Injectable()
export class CleanupUploadsOnErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CleanupUploadsOnErrorInterceptor.name);

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();

    return next
      .handle()
      .pipe(
        catchError((err: unknown) =>
          from(this.cleanup(req)).pipe(switchMap(() => throwError(() => err))),
        ),
      );
  }

  private async cleanup(req: Request): Promise<void> {
    const files = collectUploadedFiles(req);
    const results = await Promise.allSettled(
      files.map((file) => unlink(file.path)),
    );

    results.forEach((result, i) => {
      const code = (result as PromiseRejectedResult).reason?.code;
      // ENOENT é normal: o UploadSignaturePipe ou o service já podem ter apagado o ficheiro
      if (result.status === 'rejected' && code !== 'ENOENT') {
        this.logger.warn(
          `Falha ao apagar upload órfão ${files[i].path}: ${code}`,
        );
      }
    });
  }
}
