import { Prisma } from '@prisma/client';
import { StatusFeasibility } from 'src/application/usecases/feasibility.service';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';
import { ExistsResponse, GetRejectionsResponse } from '../types';

export interface IFeasibilityRepository {
  exists(idWork: number): Promise<ExistsResponse>;
  getProjectDate(idWork: number): Promise<{ data_empreitamento: Date }>;
  getRejections(workId: number): Promise<GetRejectionsResponse[]>;
  saveFiles(
    idWork: number,
    idUser: number,
    status: StatusFeasibility,
    paths: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  updateFiles(
    workId: number,
    paths: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  makeItemsFeasible(
    items: ServiceMaterialItemDto[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  findFiles(
    idWork: number,
  ): Promise<{ id: number; caminhos_arquivos: string[] }>;
  reject(
    data: RejectFeasibilityDTO,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  approve(
    workId: number,
    userId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const FEASIBILITY_REPOSITORY = Symbol('FeasibilityRepository');
