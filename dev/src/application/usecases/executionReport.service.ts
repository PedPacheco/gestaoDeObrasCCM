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
  StorageKind,
} from 'src/domain/contracts/storage/IFileStorage';
import { ExecutionReport } from 'src/domain/entities/executionReport.entity';
import { Prisma } from 'src/infra/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  parseStoredNames,
  storedFilesOf,
  uploadedPaths,
} from 'src/shared/upload/storedFileName';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';
import {
  CreateExecutionReportInput,
  UpdateExecutionReportInput,
} from '../types';
import { ProgressRecalculationService } from './services/progressRecalculation.service';

@Injectable()
export class ExecutionReportService {
  constructor(
    private readonly prisma: PrismaService, // ALTERADO
    private readonly progress: ProgressRecalculationService, // ALTERADO
    @Inject(EXECUTION_REPORT_REPOSITORY)
    private readonly executionReportRepository: IExecutionReportRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly findScheduleByIdRepository: IFindScheduleByIdRepository,
    @Inject(FILE_STORAGE)
    private readonly storage: IFileStorage,
    private readonly logger: AppLogger,
  ) {}

  async findByWorkId(idWork: number) {
    if (!idWork) {
      throw new BadRequestException('Id da obra não enviado');
    }

    const result = await this.executionReportRepository.findByWorkId(idWork);

    const formatted = result.map((item) => ({
      nome_usuario: item.usuario?.nome,
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
    data: CreateExecutionReportInput,
    scheduledFinishTime: Date,
    files: Express.Multer.File[],
    tx: Prisma.TransactionClient,
  ) {
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

      await this.executionReportRepository.create(
        executionReport.toPersistenceObject() as Prisma.relatorio_execucaoUncheckedCreateInput,
        tx,
      );
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
  ) {
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

      const scheduledFinishTime =
        await this.findScheduleByIdRepository.findById(existing.id_programacao);

      if (!scheduledFinishTime) {
        throw new NotFoundException('Programação não encontrada.');
      }

      const currentFiles = storedFilesOf(existing);
      const newFiles = files?.length ? files.map((f) => f.filename) : undefined;

      const updatedData = {
        idWork: existing.id_obra,
        idSchedule: existing.id_programacao,
        ...data,
        files: newFiles ?? currentFiles, // ← depois do spread, para não ser sobreposto
      };

      let executionReport: ExecutionReport;

      try {
        executionReport = ExecutionReport.create(
          updatedData,
          scheduledFinishTime.hora_ter,
        );
      } catch (error: unknown) {
        const err = error as { message: string };
        this.cleanupFiles(files);

        this.logger.error('Falha ao instanciar ExecutionReport para update', {
          method: 'update',
          idExecutionReport,
          error,
        });

        throw new BadRequestException(
          `Erro ao criar relatório: ${err.message}`,
        );
      }

      await this.executionReportRepository.update(
        idExecutionReport,
        executionReport.toPersistenceObject(),
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
      throw new BadRequestException('Relátorio não enviado para exclusão');
    }

    const report = await this.executionReportRepository.findById(id);

    if (!report) {
      throw new NotFoundException('Relatório de execução não encontrado.');
    }

    const storedFiles = parseStoredNames(report.caminho_arquivo);

    // ALTERADO: antes era executionReportRepository.delete(id, report.id_programacao)
    await this.prisma.$transaction((tx) =>
      this.resetExecutionAndDeleteReport(id, report.id_programacao, tx),
    );

    await this.storage.deleteStored(StorageKind.AS_BUILD, storedFiles);
  }

  // ─── Privados ───────────────────────────────────────────────────────

  // ALTERADO: orquestração que saiu do repositório
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

    if (schedule.obras?.programacao_ponto_a_ponto) {
      // Ponto a ponto: o executado da obra e os totalizadores dos itens vêm
      // SEMPRE da fonte única (qtde_real = Σ real das demais programações,
      // qtde_prog = Σ real ?? prog), nunca de soma de percentuais.
      await this.progress.recomputeAll(serviceIds, schedule.id_obra, tx);
      await this.executionReportRepository.updateWorkStatusAfterReset(
        schedule.id_obra,
        { status: WorkStatus.CONFIRMADA },
        tx,
      );
    } else {
      await this.executionReportRepository.clearServicesReal(serviceIds, tx);
      const executed =
        await this.executionReportRepository.sumWorkSchedulesExec(
          schedule.id_obra,
          tx,
        );
      await this.executionReportRepository.updateWorkStatusAfterReset(
        schedule.id_obra,
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
