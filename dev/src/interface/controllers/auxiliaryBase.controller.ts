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
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import {
  InsertBaseAuxiliaryMarketDTO,
  NotesDTO,
} from '../dtos/auxiliaryBaseDTO';
import { OperationType } from '../types/baseAuxiliaryInterface';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { CapexGateway } from '../gateway/capex/capex.gateway';

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
  ) {}

  @Post('capex/pipeline')
  @UseGuards(PermissionGuard)
  @UseInterceptors(capexFileInterceptor)
  async importAndUpdateCapex(@UploadedFile() file: Express.Multer.File) {
    const jobId = randomUUID();

    console.log(jobId);

    this.capexFullPipelineService
      .run(file.path, jobId, this.capexGateway.createEmitter(jobId))
      .catch((err) =>
        console.error(`[capex/pipeline] Erro no job ${jobId}:`, err.stack),
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
  @UseGuards(VisualizationGuard)
  async GetAuxiliaryBaseMarket(@Query('idRegional') idRegional?: number) {
    const response = await this.auxiliaryBaseService.getMarket(idRegional);
    return {
      statusCode: HttpStatus.OK,
      message: 'Valores retornados com sucesso',
      data: response,
    };
  }

  @Get('notas')
  @UseGuards(VisualizationGuard)
  async GetAuxiliaryBaseNotes(@Query('idRegional') idRegional?: number) {
    const response = await this.auxiliaryBaseService.getNotes(idRegional);
    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das notas na base auxiliar retornadas com sucesso',
      data: response,
    };
  }

  @Post('notas')
  @UseGuards(PermissionGuard)
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
  @UseGuards(PermissionGuard)
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
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseMarket(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseOv', id);
    return { statusCode: HttpStatus.OK, message: 'Obra removida com sucesso' };
  }

  @Delete('mercado')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseMarketWithoutId() {
    await this.auxiliaryBaseService.delete('baseOv', undefined);
    return { statusCode: HttpStatus.OK, message: 'Obra removida com sucesso' };
  }

  @Delete('notas/:id')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseNotes(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseNotes', id);
    return { statusCode: HttpStatus.OK, message: 'Nota removida com sucesso' };
  }

  @Delete('notas/')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseNotesWithoutId() {
    await this.auxiliaryBaseService.delete('baseNotes', undefined);
    return { statusCode: HttpStatus.OK, message: 'Nota removida com sucesso' };
  }
}
