import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import type { Request } from 'express'; // evita confusão com o Request global do fetch
import { promises as fs } from 'fs';
import { diskStorage } from 'multer';
import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import { CapexFullPipelineService } from 'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service';
import { toSafeCapexErrorMessage } from 'src/application/usecases/auxiliaryBase/capex/capexProcessing.service';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';
import {
  InsertBaseAuxiliaryMarketDTO,
  NotesDTO,
} from '../dtos/auxiliaryBaseDTO';
import { CapexGateway, getUserId } from '../gateway/capex/capex.gateway';
import { OperationType } from '../types/baseAuxiliaryInterface';

const capexFileInterceptor = FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads/imports',
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: {
    fileSize: 150 * 1024 * 1024, // 150 MB
  },
  fileFilter: (_, file, cb) => {
    const isXlsx =
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    cb(
      isXlsx ? null : new Error('Apenas arquivos .xlsx são permitidos'),
      isXlsx,
    );
  },
});

@Controller('base-auxiliar')
export class AuxiliaryBaseController {
  private readonly logger = new Logger(AuxiliaryBaseController.name);

  constructor(
    private readonly auxiliaryBaseService: AuxiliaryBaseService,
    private readonly capexFullPipelineService: CapexFullPipelineService,
    private readonly capexGateway: CapexGateway,
  ) {}

  @Post('capex/pipeline')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  @UseInterceptors(capexFileInterceptor)
  async importAndUpdateCapex(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: any },
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

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

  // ─── Demais endpoints ─────────────────────────────────────────────

  @Get('mercado')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async GetAuxiliaryBaseMarket(@Query('idRegional') idRegional?: number) {
    const response = await this.auxiliaryBaseService.getMarket(idRegional);
    return {
      statusCode: HttpStatus.OK,
      message: 'Valores retornados com sucesso',
      data: response,
    };
  }

  @Get('notas')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async GetAuxiliaryBaseNotes(@Query('idRegional') idRegional?: number) {
    const response = await this.auxiliaryBaseService.getNotes(idRegional);
    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das notas na base auxiliar retornadas com sucesso',
      data: response,
    };
  }

  @Post('notas')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async InsertAuxiliaryBaseNotes(
    @Body() body: { data: NotesDTO[]; operation: OperationType },
  ) {
    const res = await this.auxiliaryBaseService.insertAuxiliaryBaseNotes(
      body.data,
      body.operation,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Notas inseridas na base auxiliar com sucesso',
      res,
    };
  }

  @Post('mercado')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async InsertAuxiliaryBaseMarket(
    @Body()
    body: {
      data: InsertBaseAuxiliaryMarketDTO[];
      operation: OperationType;
    },
  ) {
    await this.auxiliaryBaseService.insertAuxiliaryBaseMarket(
      body.data,
      body.operation,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Obras de mercado inseridas na base auxiliar com sucesso',
    };
  }

  @Delete('mercado/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async DeleteAuxiliaryBaseMarket(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseOv', id);
    return { statusCode: HttpStatus.OK, message: 'Obra removida com sucesso' };
  }

  @Delete('mercado')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async DeleteAuxiliaryBaseMarketWithoutId() {
    await this.auxiliaryBaseService.delete('baseOv', undefined);
    return { statusCode: HttpStatus.OK, message: 'Obra removida com sucesso' };
  }

  @Delete('notas/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async DeleteAuxiliaryBaseNotes(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseNotes', id);
    return { statusCode: HttpStatus.OK, message: 'Nota removida com sucesso' };
  }

  @Delete('notas/')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async DeleteAuxiliaryBaseNotesWithoutId() {
    await this.auxiliaryBaseService.delete('baseNotes', undefined);
    return { statusCode: HttpStatus.OK, message: 'Nota removida com sucesso' };
  }
}
