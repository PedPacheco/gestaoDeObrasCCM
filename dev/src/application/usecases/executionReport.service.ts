import { ExecutionReport } from 'src/domain/entities/executionReport.entity';
import {
  EXECUTION_REPORT_REPOSITORY,
  IExecutionReportRepository,
} from 'src/domain/contracts/IExecutionReportRepository';
import {
  FIND_SCHEDULE_BY_ID_REPOSITORY,
  IFindScheduleByIdRepository,
} from 'src/domain/contracts/schedule/IFindScheduleByIdRepository';
// import { ExecutionReportDataDTO } from 'src/interface/dtos/executionReportDTO';
import { ExecutionReportServiceInterface } from 'src/interface/types/executionReportInterface';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FileService } from './file.service';
import { AppLogger } from 'src/core/logger/logger.service';

@Injectable()
export class ExecutionReportService {
  constructor(
    @Inject(EXECUTION_REPORT_REPOSITORY)
    private readonly executionReportRepository: IExecutionReportRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly findScheduleByIdRepository: IFindScheduleByIdRepository,
    private readonly fileService: FileService,
    private readonly logger: AppLogger,
  ) {}

  async findByWorkId(idWork: number) {
    if (!idWork) {
      throw new BadRequestException('Id da obra não enviado');
    }

    const result = await this.executionReportRepository.findByWorkId(idWork);

    const formatted = result.map((item) => ({
      nome_usuario: item.usuario?.nome_usuario,
      ovnota: item.obras?.ovnota,
      ordem_dci: item.obras?.ordem_dci,
      tipo_obra: item.obras?.tipos?.tipo_obra,
      data_exec: item.programacoes.data_prog,
      prog: item.programacoes.prog,
      exec: item.programacoes.exec,
      status: item.obras.status.status,
      num_dp: item.programacoes.num_dp,
      hora_ini: item.programacoes.hora_ini,
      hora_ter: item.programacoes.hora_ter,
      chave_provisoria: item.programacoes.chave_provisoria,
      ...item,

      // Remove os objetos aninhados
      usuario: undefined,
      obras: undefined,
      programacoes: undefined,
    }));

    return formatted;
  }

  async create(
    data: ExecutionReportServiceInterface,
    scheduledFinishTime: Date,
    files: Express.Multer.File[],
    tx: Prisma.TransactionClient,
  ) {
    const existing = await this.executionReportRepository.findByScheduleId(
      data.idSchedule,
      tx,
    );

    if (existing) {
      return;
    }

    try {
      if (!files) {
        throw new BadRequestException('Arquivos não foram enviados');
      }

      const filePath = files.map((file) => file.filename).join(';');

      const executionReport = ExecutionReport.create(
        { ...data, files: filePath },
        scheduledFinishTime,
      );

      await this.executionReportRepository.create(
        executionReport.toPersistenceObject() as Prisma.relatorio_execucaoUncheckedCreateInput,
        tx,
      );
    } catch (error) {
      this.cleanupFiles(files);

      this.logger.errorWithMetadata(
        'Falha ao persistir relatório de execução',
        {
          method: 'create',
          idSchedule: data.idSchedule,
          error,
        },
      );

      throw error;
    }
  }

  async update(
    idExecutionReport: number,
    data: any,
    files?: Express.Multer.File[],
  ) {
    if (!data) {
      throw new BadRequestException('Nenhum relatório fornecida para edição.');
    }

    const existing =
      await this.executionReportRepository.findById(idExecutionReport);

    if (!existing) {
      throw new NotFoundException('Relatório de execução não encontrado.');
    }

    const scheduledFinishTime = await this.findScheduleByIdRepository.findById(
      existing.id_programacao,
    );

    if (!scheduledFinishTime) {
      throw new NotFoundException('Programação não encontrada.');
    }

    const newFilesPath = files?.length
      ? files.map((f) => f.filename).join(';')
      : undefined;

    const finalFilesPath = newFilesPath ?? existing.caminho_arquivo;

    const updatedData = {
      idWork: existing.id_obra,
      idSchedule: existing.id_programacao,
      files: finalFilesPath,
      ...data,
    };

    let executionReport: ExecutionReport;

    try {
      executionReport = ExecutionReport.create(
        updatedData,
        scheduledFinishTime.hora_ter,
      );
    } catch (error: any) {
      this.cleanupFiles(files);

      this.logger.error('Falha ao instanciar ExecutionReport para update', {
        method: 'update',
        idExecutionReport,
        error,
      });

      throw new BadRequestException(
        `Erro ao criar relatório: ${error.message}`,
      );
    }

    await this.executionReportRepository.update(
      idExecutionReport,
      executionReport.toPersistenceObject(),
    );

    if (newFilesPath && existing.caminho_arquivo) {
      for (const oldFile of existing.caminho_arquivo.split(';')) {
        this.fileService.deleteFile(
          `${process.env.UPLOAD_AS_BUILD}/${oldFile}`,
        );
      }
    }
  }

  async delete(id: number): Promise<void> {
    if (!id) {
      throw new BadRequestException('Relátorio não enviado para exclusão');
    }

    const report = await this.executionReportRepository.findById(id);

    if (!report) {
      throw new NotFoundException('Relatório de execução não encontrado.');
    }

    const files = report.caminho_arquivo.split(';');

    for (const file of files) {
      this.fileService.deleteFile(`${process.env.UPLOAD_AS_BUILD}/${file}`);
    }

    await this.executionReportRepository.delete(id, report.id_programacao);
  }

  private cleanupFiles(files?: Express.Multer.File[]): void {
    if (!files?.length) return;

    for (const file of files) {
      this.fileService.deleteFile(
        `${process.env.UPLOAD_AS_BUILD}/${file.path}`,
      );
    }
  }
}
