import { Prisma } from 'src/infra/generated/prisma/client';
import {
  FeasibilityExportWork,
  FeasibilityFiles,
  FeasibilityFileType,
  FeasibilityRejection,
  FeasibilityReport,
  FeasibleItemUpdate,
  RejectFeasibilityData,
  StatusFeasibility,
} from '../types';

export interface IFeasibilityRepository {
  findById(id: number): Promise<FeasibilityReport | null>;
  getProjectDate(workId: number): Promise<Date | null>;
  getRejections(workId: number): Promise<FeasibilityRejection[]>;
  exportFeasibility(
    statusId: number,
    partnerIds?: number[],
  ): Promise<FeasibilityExportWork[]>;
  saveFiles(
    workId: number,
    userId: number,
    status: StatusFeasibility,
    paths: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  updateFiles(
    workId: number,
    paths: string[],
    type: FeasibilityFileType,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  makeItemsFeasible(
    items: FeasibleItemUpdate[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  findFiles(workId: number): Promise<FeasibilityFiles | null>;
  reject(
    data: RejectFeasibilityData,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  approve(
    workId: number,
    userId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const FEASIBILITY_REPOSITORY = Symbol('FeasibilityRepository');
