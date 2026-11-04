import { GetAllWorksItem } from 'src/domain/types';

export class GetAllWorksInput {
  idRegional?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
  idStatus?: number[];
  page?: number;
  insufficientPermission?: boolean;
}

export type GetAllWorksOutput = {
  works: GetAllWorksItem[];
  totalRecords: number;
};
