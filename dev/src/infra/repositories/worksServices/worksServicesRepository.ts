import { Injectable } from '@nestjs/common';
import {
  ImportServiceItem,
  IWorkServicesRepository,
  SchedulesProgressUpdate,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import {
  DEMOTED_WORK_STATUS,
  ScheduleItem,
  ServiceExecutionStatus,
  ServiceTotals,
  WorkItem,
} from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/infra/generated/prisma/client';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

const SCHEDULE_ITEM_SELECT = {
  id_programacao: true,
  id_servico: true,
  prog: true,
  real: true,
  servicos: { select: { id_material: true } },
  status: true,
} satisfies Prisma.programacoes_servicosSelect;

type ScheduleItemRow = Prisma.programacoes_servicosGetPayload<{
  select: typeof SCHEDULE_ITEM_SELECT;
}>;

const toScheduleItem = (row: ScheduleItemRow): ScheduleItem => ({
  scheduleId: row.id_programacao,
  serviceId: row.id_servico,
  prog: row.prog,
  real: row.real,
  isMaterial: row.servicos.id_material !== null,
  status: row.status as ServiceExecutionStatus,
});

@Injectable()
export class WorkServicesRepository implements IWorkServicesRepository {
  // ─── Programação de itens ───────────────────────────────────────────

  async updateScheduleStatus(
    idSchedule: number,
    idStatus: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.programacoes.update({
      where: { id: idSchedule },
      data: { id_status_programacao: idStatus, reprovada: false },
    });
  }

  async createScheduleItems(
    idSchedule: number,
    data: ScheduleServicesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.programacoes_servicos.createMany({
      data: data.map(({ id, idTeam, prog, additional }) => ({
        id_programacao: idSchedule,
        id_servico: id,
        id_equipe: idTeam,
        prog,
        adicional: additional,
      })),
    });
  }

  async updateServicesAdditional(
    data: { id: number; additional: number }[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await Promise.all(
      data.map(({ id, additional }) =>
        tx.servicos.update({
          where: { id },
          data: { qtde_adicional: additional },
        }),
      ),
    );
  }

  // ─── Cancelamento ───────────────────────────────────────────────────

  findScheduleStatus(id: number, tx: Prisma.TransactionClient) {
    return tx.programacoes.findUnique({
      where: { id },
      select: { id_obra: true, id_status_programacao: true },
    });
  }

  findScheduleItemsExecution(id: number, tx: Prisma.TransactionClient) {
    return tx.programacoes_servicos.findMany({
      where: { id_programacao: id },
      select: { id_servico: true, real: true, status: true },
    });
  }

  async deleteScheduleItems(
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.programacoes_servicos.deleteMany({
      where: { id_programacao: id },
    });
  }

  async resetScheduleProgress(
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.programacoes.update({
      where: { id },
      data: { prog: 0, exec: null },
    });
  }

  // ─── Itens da obra (sem alterações) ─────────────────────────────────

  async applyAdditional(
    data: ApplyAdditonalDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await Promise.all(
      data.map(({ additional, id }) =>
        tx.servicos.updateMany({
          data: { qtde_adicional: additional },
          where: { id },
        }),
      ),
    );
  }

  async addItem(
    data: AddServicesDTO,
    type: 'service' | 'material',
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const {
      idService,
      idWork,
      operation,
      point,
      operationDescription,
      quantity,
    } = data;
    await tx.servicos.create({
      data: {
        id_obra: idWork,
        id_contrato_servico: type === 'service' ? idService : null,
        id_material: type === 'material' ? idService : null,
        operacao: operation,
        ponto: point,
        descricao_operacao: operationDescription,
        qtde_plan: 0,
        viabilizado: quantity,
      },
    });
  }

  async delete(id: number, tx: Prisma.TransactionClient): Promise<void> {
    await tx.servicos.delete({ where: { id } });
  }

  async deleteAll(workId: number, tx: Prisma.TransactionClient): Promise<void> {
    await tx.servicos.deleteMany({ where: { id_obra: workId } });
    await tx.relatorio.deleteMany({ where: { id_obra: workId } });
  }

  async bulkImportItems(
    workId: number,
    items: ImportServiceItem[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (items.length === 0) return;

    await tx.servicos.createMany({
      data: items.map((item) => ({
        id_obra: workId,
        id_contrato_servico: item.type === 'service' ? item.idService : null,
        id_material: item.type === 'material' ? item.idService : null,
        operacao: item.operation,
        ponto: item.point,
        numero_operacao: item.operationNumber,
        descricao_operacao: item.operationDescription,
        qtde_plan: item.plannedQuantity,
        qtde_adicional: 0,
      })),
    });

    await tx.relatorio.upsert({
      where: { id_obra: workId },
      create: { id_obra: workId, encontrado: true },
      update: { encontrado: true },
    });
  }

  // ─── Recálculo: leituras ────────────────────────────────────────────

  async findScheduleItemsByServiceIds(
    serviceIds: number[],
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleItem[]> {
    const rows = await tx.programacoes_servicos.findMany({
      where: { id_servico: { in: serviceIds } },
      select: SCHEDULE_ITEM_SELECT,
    });
    return rows.map(toScheduleItem);
  }

  async findScheduleItemsByWork(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleItem[]> {
    const rows = await tx.programacoes_servicos.findMany({
      where: { programacoes: { id_obra: workId } },
      select: SCHEDULE_ITEM_SELECT,
    });
    return rows.map(toScheduleItem);
  }

  async findWorkItems(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<WorkItem[]> {
    const rows = await tx.servicos.findMany({
      where: { id_obra: workId },
      select: {
        id: true,
        id_material: true,
        viabilizado: true,
        qtde_adicional: true,
        qtde_real: true,
      },
    });
    return rows.map((row) => ({
      serviceId: row.id,
      isMaterial: row.id_material !== null,
      enabledQuantity: row.viabilizado,
      additionalQuantity: row.qtde_adicional,
      realQuantity: row.qtde_real,
    }));
  }

  async findWorkStatus(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<number | null> {
    const work = await tx.obras.findUnique({
      where: { id: workId },
      select: { id_status: true },
    });
    return work?.id_status ?? null;
  }

  // ─── Recálculo: escritas ────────────────────────────────────────────

  async updateServiceTotals(
    totals: ServiceTotals[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await Promise.all(
      totals.map(({ serviceId, plannedQuantity, realQuantity }) =>
        tx.servicos.update({
          where: { id: serviceId },
          data: { qtde_prog: plannedQuantity, qtde_real: realQuantity },
        }),
      ),
    );
  }

  async updateSchedulesProgress(
    data: SchedulesProgressUpdate[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (data.length === 0) return;

    const progCases = Prisma.join(
      data.map(
        (d) =>
          Prisma.sql`WHEN ${d.idProgramacao}::INT THEN ${d.prog}::DOUBLE PRECISION`,
      ),
      ' ',
    );
    const execCases = Prisma.join(
      data.map((d) =>
        d.exec == null
          ? Prisma.sql`WHEN ${d.idProgramacao}::INT THEN NULL::DOUBLE PRECISION`
          : Prisma.sql`WHEN ${d.idProgramacao}::INT THEN ${d.exec}::DOUBLE PRECISION`,
      ),
      ' ',
    );
    const ids = Prisma.join(data.map((d) => d.idProgramacao));

    await tx.$executeRaw`
      UPDATE programacoes
         SET prog = CASE id ${progCases} END,
             exec = CASE id ${execCases} END
       WHERE id IN (${ids})
    `;
  }

  async updateWorkProgress(
    workId: number,
    executed: number,
    demote: boolean,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.obras.update({
      where: { id: workId },
      data: {
        executado: executed,
        ...(demote && { id_status: DEMOTED_WORK_STATUS, data_conclusao: null }),
      },
    });
  }
}
