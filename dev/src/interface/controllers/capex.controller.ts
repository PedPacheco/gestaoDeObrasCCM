import {
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import type { Request } from 'express'; // evita confusão com o Request global do fetch
import { promises as fs } from 'fs';

import { CapexFullPipelineService } from 'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service';
import { AreaEditGuard } from 'src/core/guards/newPermission.guard';

import { toSafeCapexErrorMessage } from 'src/application/types/usecases/auxiliaryBase/capex-error.util';
import { assertXlsxUpload } from 'src/application/types/usecases/auxiliaryBase/capex-upload.util';
import { CapexGateway, getUserId } from '../gateway/capex/capex.gateway';
import { CONSTRUCTION_AREA_ID } from '../shared/costants';

// A rota continua sob /base-auxiliar para não quebrar o front.
@Controller('base-auxiliar')
export class CapexController {
  private readonly logger = new Logger(CapexController.name);

  constructor(
    private readonly capexFullPipelineService: CapexFullPipelineService,
    private readonly capexGateway: CapexGateway,
  ) {}

  @Post('capex/pipeline')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(
    AreaEditGuard({ allowedAreas: [CONSTRUCTION_AREA_ID], blockPartner: true }),
  )
  @UseInterceptors(FileInterceptor('file'))
  async importAndUpdateCapex(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: any },
  ) {
    // Extensão + assinatura do zip (remove o arquivo se for rejeitado).
    await assertXlsxUpload(file);

    // Já existe um pipeline rodando: o service não chegará a ser chamado,
    // então quem remove o arquivo enviado é este controller.
    if (this.capexFullPipelineService.isRunning) {
      await fs.unlink(file.path).catch(() => undefined);
      throw new ConflictException(
        'Já existe uma atualização de CAPEX em andamento.',
      );
    }

    const jobId = randomUUID();
    const emit = this.capexGateway.createEmitter(jobId, getUserId(req.user));

    // Os services já emitem 'error' (com mensagem segura) e removem o arquivo.
    // O catch abaixo é a rede de segurança para falhas fora deles; o gateway
    // ignora este evento se o job já terminou.
    this.capexFullPipelineService.run(file.path, jobId, emit).catch((err) => {
      this.logger.error(`[capex/pipeline] Erro no job ${jobId}`, err?.stack);
      emit({
        phase: 'error',
        processed: 0,
        percentage: 0,
        message: toSafeCapexErrorMessage(err),
      });
    });

    return {
      statusCode: HttpStatus.ACCEPTED,
      message:
        'Pipeline de importação e atualização de CAPEX iniciado. Acompanhe via WebSocket.',
      jobId,
    };
  }
}
