import { ExecutionReport } from 'src/domain/entities/executionReport.entity';
import {
  EXECUTION_REPORT_REPOSITORY,
  IExecutionReportRepository,
} from 'src/domain/repositories/IExecutionReportRepository';
import {
  FIND_SCHEDULE_BY_ID_REPOSITORY,
  IFindScheduleByIdRepository,
} from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { ExecutionReportDataDTO } from 'src/interface/dtos/executionReportDTO';
import { ExecutionReportServiceInterface } from 'src/interface/types/executionReportInterface';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExecutionReportService {
  constructor(
    @Inject(EXECUTION_REPORT_REPOSITORY)
    private readonly executionReportRepository: IExecutionReportRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly findScheduleByIdRepository: IFindScheduleByIdRepository,
  ) {}

  async create(
    data: ExecutionReportServiceInterface,
    scheduledFinishTime: Date,
    tx: Prisma.TransactionClient,
  ) {
    const existing = await this.executionReportRepository.findByScheduleId(
      data.idSchedule,
      tx,
    );

    if (existing) {
      return;
    }

    const executionReport = ExecutionReport.create(data, scheduledFinishTime);

    await this.executionReportRepository.create(
      executionReport.toPersistenceObject() as Prisma.relatorio_execucaoUncheckedCreateInput,
      tx,
    );
  }

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

  async update(idExecutionReport: number, data: ExecutionReportDataDTO) {
    if (!data) {
      throw new BadRequestException('Nenhum relatório fornecida para edição.');
    }

    const existing =
      await this.executionReportRepository.findById(idExecutionReport);

    if (!existing) {
      throw new NotFoundException('Relatório de execução não encontrado.');
    }

    const scheduledFinishTime = await this.findScheduleByIdRepository.findById(
      existing.idSchedule,
    );

    if (!scheduledFinishTime) {
      throw new NotFoundException('Programação não encontrada.');
    }

    const updatedData = {
      idWork: existing.idWork,
      idSchedule: existing.idSchedule,
      ...data,
    };

    try {
      const executionReport = ExecutionReport.create(
        updatedData,
        scheduledFinishTime.hora_ter,
      );

      await this.executionReportRepository.update(
        idExecutionReport,
        executionReport.toPersistenceObject(),
      );
    } catch (error) {
      throw new BadRequestException(
        `Erro ao criar relatório: ${error.message}`,
      );
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

    await this.executionReportRepository.delete(id, report.id_programacao);
  }
}
