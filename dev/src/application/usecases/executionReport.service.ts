import {
  EXECUTION_REPORT_REPOSITORY,
  IExecutionReportRepository,
} from 'src/domain/contracts/IExecutionReportRepository';
import {
  FIND_SCHEDULE_BY_ID_REPOSITORY,
  IFindScheduleByIdRepository,
} from 'src/domain/contracts/works/schedule/IFindScheduleByIdRepository';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AppLogger } from 'src/core/logger/logger.service';
import {
  FILE_STORAGE,
  IFileStorage,
} from 'src/domain/contracts/storage/IFileStorage';
import { ExecutionReport } from 'src/domain/entities/executionReport.entity';
import { StorageKind } from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { uploadedPaths } from 'src/shared/upload/storedFileName';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

import { toExecutionReportListItemOutput } from '../mappers/executionReportMapper';
import {
  CreateExecutionReportInput,
  ExecutionReportListItemOutput,
  UpdateExecutionReportInput,
} from '../types';
import { ProgressRecalculationService } from './services/progressRecalculation.service';

@Injectable()
export class ExecutionReportService {
  constructor(
    private readonly prisma: PrismaService, // sai na 5D (IUnitOfWork)
    private readonly progress: ProgressRecalculationService,
    @Inject(EXECUTION_REPORT_REPOSITORY)
    private readonly executionReportRepository: IExecutionReportRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly findScheduleByIdRepository: IFindScheduleByIdRepository,
    @Inject(FILE_STORAGE)
    private readonly storage: IFileStorage,
    private readonly logger: AppLogger,
  ) {}

  async findByWorkId(idWork: number): Promise<ExecutionReportListItemOutput[]> {
    if (!idWork) throw new BadRequestException('Id da obra não enviado');
    const reports =
      await this.executionReportRepository.findByWorkIdentifier(idWork);
    return reports.map(toExecutionReportListItemOutput);
  }

  async create(
    data: CreateExecutionReportInput,
    scheduledFinishTime: Date,
    files: Express.Multer.File[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    try {
      const existing = await this.executionReportRepository.findByScheduleId(
        data.idSchedule,
        tx,
      );
      if (existing) {
        await this.cleanupFiles(files);
        return;
      }

      if (!files) {
        throw new BadRequestException('Arquivos não foram enviados');
      }

      const executionReport = ExecutionReport.create(
        { ...data, files: files.map((file) => file.filename) },
        scheduledFinishTime,
      );

      await this.executionReportRepository.create(executionReport, tx);
    } catch (error) {
      await this.cleanupFiles(files);
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
    data: UpdateExecutionReportInput,
    files?: Express.Multer.File[],
  ): Promise<void> {
    const replacedFiles = await this.withUploadCleanup(files, async () => {
      if (!data) {
        throw new BadRequestException(
          'Nenhum relatório fornecida para edição.',
        );
      }

      const existing =
        await this.executionReportRepository.findById(idExecutionReport);
      if (!existing) {
        throw new NotFoundException('Relatório de execução não encontrado.');
      }

      const schedule = await this.findScheduleByIdRepository.findById(
        existing.scheduleId,
      );
      if (!schedule) {
        throw new NotFoundException('Programação não encontrada.');
      }

      const currentFiles = existing.filePaths;
      const newFiles = files?.length ? files.map((f) => f.filename) : undefined;

      const executionReport = this.buildForUpdate(
        idExecutionReport,
        {
          idWork: existing.workId,
          idSchedule: existing.scheduleId,
          ...data,
          files: newFiles ?? currentFiles, // depois do spread, para não ser sobreposto
        },
        schedule.scheduledFinishTime, // ⚠ muda quando o IFindScheduleByIdRepository for refatorado
      );

      await this.executionReportRepository.update(
        idExecutionReport,
        executionReport,
      );

      // Só são substituídos os ficheiros antigos se vieram ficheiros novos
      return newFiles ? currentFiles : [];
    });

    // Base de dados atualizada: agora sim, apaga os ficheiros ANTIGOS
    await this.storage.deleteStored(StorageKind.AS_BUILD, replacedFiles);
  }

  /**
   * Apaga o relatório de execução e repõe TODA a execução da programação:
   * real = null em todas as linhas, exec = null, programação e obra voltam
   * a CONFIRMADA e a data de conclusão é limpa.
   */
  async delete(id: number): Promise<void> {
    if (!id) {
      throw new BadRequestException('Relatório não enviado para exclusão');
    }

    const report = await this.executionReportRepository.findById(id);
    if (!report) {
      throw new NotFoundException('Relatório de execução não encontrado.');
    }

    await this.prisma.$transaction((tx) =>
      this.resetExecutionAndDeleteReport(id, report.scheduleId, tx),
    );

    await this.storage.deleteStored(StorageKind.AS_BUILD, report.filePaths);
  }

  // ─── Privados ───────────────────────────────────────────────────────

  /** Mantém a mensagem atual ("Erro ao criar relatório: ...") e o log. */
  private buildForUpdate(
    idExecutionReport: number,
    props: CreateExecutionReportInput,
    scheduledFinishTime: Date,
  ): ExecutionReport {
    try {
      return ExecutionReport.create(props, scheduledFinishTime);
    } catch (error) {
      this.logger.error('Falha ao instanciar ExecutionReport para update', {
        method: 'update',
        idExecutionReport,
        error,
      });
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Erro ao criar relatório: ${message}`);
    }
  }

  private async resetExecutionAndDeleteReport(
    id: number,
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const schedule = await this.executionReportRepository.findScheduleWorkMode(
      idSchedule,
      tx,
    );
    if (!schedule) {
      throw new NotFoundException(
        `Programação com ID ${idSchedule} não encontrada`,
      );
    }

    const serviceIds =
      await this.executionReportRepository.findScheduledServiceIds(
        idSchedule,
        tx,
      );

    await this.executionReportRepository.resetScheduleExecution(
      idSchedule,
      ScheduleStatus.CONFIRMADA,
      tx,
    );

    if (schedule.pointToPoint) {
      // Ponto a ponto: o executado da obra e os totalizadores dos itens vêm
      // SEMPRE da fonte única (qtde_real = Σ real das demais programações,
      // qtde_prog = Σ real ?? prog), nunca de soma de percentuais.
      await this.progress.recomputeAll(serviceIds, schedule.workId, tx);
      await this.executionReportRepository.updateWorkStatusAfterReset(
        schedule.workId,
        { status: WorkStatus.CONFIRMADA },
        tx,
      );
    } else {
      await this.executionReportRepository.clearServicesReal(serviceIds, tx);
      const executed =
        await this.executionReportRepository.sumWorkSchedulesExec(
          schedule.workId,
          tx,
        );
      await this.executionReportRepository.updateWorkStatusAfterReset(
        schedule.workId,
        { status: WorkStatus.CONFIRMADA, executed },
        tx,
      );
    }

    await this.executionReportRepository.deleteReport(id, tx);
  }

  private async withUploadCleanup<T>(
    files: Express.Multer.File[] | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      await this.cleanupFiles(files);
      throw error;
    }
  }

  private async cleanupFiles(files?: Express.Multer.File[]): Promise<void> {
    const paths = uploadedPaths(files);
    if (paths.length) {
      await this.storage.deleteUploaded(StorageKind.AS_BUILD, paths);
    }
  }
}
