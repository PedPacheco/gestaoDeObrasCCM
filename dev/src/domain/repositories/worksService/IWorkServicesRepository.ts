import {
  ScheduleItem,
  ServiceTotals,
  WorkItem,
} from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/infra/generated/prisma/client';

import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

export interface ScheduleTotalsById {
  prog: number;
  exec: number | null;
}

export interface ScheduleProgress extends ScheduleTotalsById {
  idProgramacao: number;
}

/** Mantido por compatibilidade: tem o mesmo formato que ScheduleProgress. */
export type SchedulesProgressUpdate = ScheduleProgress;

export interface ParsedSpreadsheetItem {
  point: string | null;
  operation: string | null;
  operationNumber: string | null;
  materialCode: string | null;
  plannedQuantity: number;
  type: 'service' | 'material';
  operationDescription: string | null;
}

export interface ImportServiceItem {
  idService: number;
  type: 'service' | 'material';
  operation?: string;
  point: string;
  operationNumber: string;
  operationDescription: string;
  plannedQuantity: number;
}

export interface IWorkServicesRepository {
  // ─── Programação de itens ───────────────────────────────────────────
  /** Atualiza o estado da programação e limpa o flag de reprovada. */
  updateScheduleStatus(
    idSchedule: number,
    idStatus: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  createScheduleItems(
    idSchedule: number,
    data: ScheduleServicesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  /** Grava o qtde_adicional de cada serviço (update: falha se o serviço não existir). */
  updateServicesAdditional(
    data: { id: number; additional: number }[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;

  // ─── Cancelamento ───────────────────────────────────────────────────
  findScheduleStatus(
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<{ id_obra: number; id_status_programacao: number | null } | null>;
  findScheduleItemsExecution(
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<{ id_servico: number; real: number | null }[]>;
  deleteScheduleItems(id: number, tx: Prisma.TransactionClient): Promise<void>;
  /** Repõe prog = 0 e exec = null na programação. */
  resetScheduleProgress(
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;

  // ─── Itens da obra ──────────────────────────────────────────────────
  applyAdditional(
    data: ApplyAdditonalDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  addItem(
    data: AddServicesDTO,
    type: 'service' | 'material',
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  delete(id: number, tx: Prisma.TransactionClient): Promise<void>;
  deleteAll(workId: number, tx: Prisma.TransactionClient): Promise<void>;
  bulkImportItems(
    workId: number,
    items: ImportServiceItem[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;

  // ─── Recálculo: leituras ────────────────────────────────────────────
  findScheduleItemsByServiceIds(
    serviceIds: number[],
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleItem[]>;
  findScheduleItemsByWork(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleItem[]>;
  findWorkItems(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<WorkItem[]>;
  findWorkStatus(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<number | null>;

  // ─── Recálculo: escritas ────────────────────────────────────────────
  updateServiceTotals(
    totals: ServiceTotals[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  /** UPDATE em lote de prog/exec de várias programações (SQL raw, sem N+1). */
  updateSchedulesProgress(
    data: SchedulesProgressUpdate[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  /** Grava o executado da obra. Com demote = true, tira a obra de "concluída" (regra 3). */
  updateWorkProgress(
    workId: number,
    executed: number,
    demote: boolean,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const WORK_SERVICES_REPOSITORY = Symbol('WorkServicesRepository');
