import {
  GetMaterialsContractsResponse,
  GetSelectedServicesParamsRequest,
  GetServiceOptionsResponse,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryByIdScheduleResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesContractsResponse,
  GetServicesSelectedByWorkIdResponse,
  GetTeamsServicesResponse,
  WorkToExportResponse,
} from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';

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
  }: GetSelectedServicesParamsRequest): Promise<
    GetServicesSelectedByWorkIdResponse[]
  >;
  getServiceScheduleHistory(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServiceScheduleHistoryResponse[]>;
  getServiceScheduleHistoryByIdSchedule(
    ids: number[],
  ): Promise<GetServiceScheduleHistoryByIdScheduleResponse[]>;
  getServicesToExportation(params: {
    dataFinal: string;
    dataInicial: string;
    idParceira: number[];
    idEquipe?: number[];
  }): Promise<WorkToExportResponse[]>;
  getServicesContracts(
    idParceira: number,
  ): Promise<GetServicesContractsResponse[]>;
  getMaterialsContract(): Promise<GetMaterialsContractsResponse[]>;
  getTeamsServices(idParceira: number): Promise<GetTeamsServicesResponse[]>;
  getServiceOptions(id: number): Promise<GetServiceOptionsResponse>;
}

export const WORK_SERVICES_QUERY_REPOSITORY = Symbol(
  'WorkServicesQueryRepository',
);
