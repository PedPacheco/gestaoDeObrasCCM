import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import { CapexFullPipelineService } from 'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service';
import {
  InsertBaseAuxiliaryMarketDTO,
  NotesDTO,
} from '../dtos/auxiliaryBaseDTO';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { CapexGateway } from '../gateway/capex/capex.gateway';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';
import { AppLogger } from 'src/core/logger/logger.service';
import { OperationType } from 'src/application/types';

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
  constructor(
    private readonly auxiliaryBaseService: AuxiliaryBaseService,
    private readonly capexFullPipelineService: CapexFullPipelineService,
    private readonly capexGateway: CapexGateway,
    private readonly logger: AppLogger,
  ) {}

  @Post('capex/pipeline')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  @UseInterceptors(capexFileInterceptor)
  async importAndUpdateCapex(@UploadedFile() file: Express.Multer.File) {
    const jobId = randomUUID();

    this.capexFullPipelineService
      .run(file.path, jobId, this.capexGateway.createEmitter(jobId))
      .catch((err) =>
        this.logger.error(
          `[capex/pipeline] Erro no job ${jobId}`,

          err instanceof Error ? err.stack : String(err),
        ),
      );

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
