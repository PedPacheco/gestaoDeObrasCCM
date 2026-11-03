import { Prisma } from 'src/infra/generated/prisma/client';
import {
  GetSelectedServicesParamsInterface,
  GetServiceOptionsResponse,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesSelectedByWorkIdResponse,
  WorkToExportResponse,
} from 'src/interface/types/servicesInterface';

export interface ServiceForScheduling {
  id: number;
  id_obra: number;
  id_material: number | null;
  viabilizado: number | null;
  qtde_adicional: number | null;
  qtde_real: number | null;
  ponto: string | null;
  operacao: string | null;
  descricao_operacao: string | null;
}

export interface IWorkServicesQueryRepository {
  getAllServicesOfWork(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServicesByWorkIdResponse[]>;
  getNotScheduledServices(id: number): Promise<GetServicesByWorkIdResponse[]>;
  /** Serviços (por id) com o necessário para validar posse e saldo ao programar. */
  findServicesForScheduling(
    ids: number[],
    tx: Prisma.TransactionClient,
  ): Promise<ServiceForScheduling[]>;
  getSelectedServices({
    id,
    idProgramacao,
  }: GetSelectedServicesParamsInterface): Promise<
    GetServicesSelectedByWorkIdResponse[]
  >;
  getServiceScheduleHistory(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServiceScheduleHistoryResponse[]>;
  getServiceScheduleHistoryByIdSchedule(ids: number[]): Promise<any[]>;
  getServicesToExportation(params: {
    dataFinal: string;
    dataInicial: string;
    idParceira: number[];
    idEquipe?: number[];
  }): Promise<WorkToExportResponse[]>;
  getServicesContracts(idParceira: number): Promise<any[]>;
  getMaterialsContract(): Promise<any[]>;
  getTeamsServices(idParceira: number): Promise<any[]>;
  getServiceOptions(id: number): Promise<GetServiceOptionsResponse>;
}

export const WORK_SERVICES_QUERY_REPOSITORY = Symbol(
  'WorkServicesQueryRepository',
);
