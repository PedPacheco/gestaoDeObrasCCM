import { Prisma } from '@prisma/client';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';

export interface IFeasibilityRepository {
  exists(idWork: number): Promise<any[]>;
  getRejections(idWork: number): Promise<any[]>;
  saveFiles(
    idWork: number,
    idUser: number,
    files: Express.Multer.File[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  makeItemsFeasible(
    items: ServiceMaterialItemDto[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  findFiles(
    idWork: number,
  ): Promise<{ id: number; caminho_arquivo: string; id_obra: number }[]>;
  deleteFiles(idWork: number): Promise<void>;
  reject(
    data: RejectFeasibilityDTO,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  approve(idWork: number): Promise<void>;
}

export const FEASIBILITY_REPOSITORY = Symbol('FeasibilityRepository');
