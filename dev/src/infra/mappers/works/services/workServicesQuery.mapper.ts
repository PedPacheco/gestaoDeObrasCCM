import type {
  GetMaterialsContractsResponse,
  GetServiceScheduleHistoryByIdScheduleResponse,
  GetServicesByWorkIdResponse,
  GetServicesSelectedByWorkIdResponse,
  ServiceToExport,
  WorkToExportResponse,
} from 'src/domain/types';
import { toNumberPreco } from 'src/infra/shared/decimalMapper';
import {
  BaseServiceRow,
  MaterialContractRow,
  ScheduleHistoryByIdScheduleRow,
  SelectedServiceRow,
  ServiceToExportRow,
  WorkToExportRow,
} from 'src/infra/types/repositories/services/workServicesQuery.types';

export function toServiceByWorkId(
  row: BaseServiceRow,
): GetServicesByWorkIdResponse {
  return { ...row, materiais: toNumberPreco(row.materiais) };
}

export function toSelectedService(
  row: SelectedServiceRow,
): GetServicesSelectedByWorkIdResponse {
  return {
    ...row,
    servicos: {
      ...row.servicos,
      materiais: row.servicos.materiais
        ? toNumberPreco(row.servicos.materiais)
        : null,
    },
  };
}

export function toScheduleHistoryByIdSchedule(
  row: ScheduleHistoryByIdScheduleRow,
): GetServiceScheduleHistoryByIdScheduleResponse {
  return {
    ...row,
    servicos: {
      ...row.servicos,
      materiais: row.servicos.materiais
        ? toNumberPreco(row.servicos.materiais)
        : null,
    },
  };
}

export function toMaterialContract(
  row: MaterialContractRow,
): GetMaterialsContractsResponse {
  return { ...row, preco: row.preco.toNumber() };
}

export function toServiceToExport(row: ServiceToExportRow): ServiceToExport {
  return {
    ...row,
    materiais: row.materiais ? toNumberPreco(row.materiais) : null,
  };
}

export function toWorkToExport(row: WorkToExportRow): WorkToExportResponse {
  return {
    ...row,
    servicos: row.servicos ? row.servicos.map(toServiceToExport) : null,
  };
}
