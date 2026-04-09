import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';

export const mockGetScheduleRestrictions: GetScheduleRestrictions = {
  id: 9045,
  ovnota: '12398586',
  diagrama: '170000002955',
  ordem_dci: '170000002955',
  ordem_dcim: null,
  executado: 0,
  mun: 'MCR',
  tipo_obra: 'POSTE',
  parceira: 'LIG',
  prog_id: 101,
  data_prog: new Date('2024-10-01T00:00:00.000Z'),
  prog: 100,
  exec: null,
  observacao_restricao: 'Aguardando liberação de área',
  id_restricao_prog1: 2,
  restricao1: 'Licença ambiental',
  responsabilidade1: 'Órgão ambiental',
  nome_responsavel: 'João Silva',
  area_responsavel1: 'Meio Ambiente',
  status_restricao1: 'Pendente',
  data_resolucao1: null,
  id_restricao_prog2: 1,
  restricao2: 'Sem restrição',
  responsabilidade2: null,
  nome_responsavel2: null,
  area_responsavel2: null,
  status_restricao2: 'Resolvido',
  data_resolucao2: new Date('2024-09-15T00:00:00.000Z'),
};

export const mockGetRestrictionsFilters: GetRestrictionsDTO = {
  dataInicial: '2024-10-01',
  dataFinal: '2024-10-31',
  ovnota: '12398586',
  idRegional: [1, 2],
  idMunicipio: [10, 20],
  idGrupo: [3],
  idTipo: [5],
  idParceira: [7],
  idRestricao: [2, 4],
  executado: false,
  page: 0,
};

export const mockInsertPublicationRestrictions: InsertPublicationRestrictionsDTO[] =
  [
    {
      id: 1,
      idRestriction: 10,
      responsibility: 'ENGENHARIA',
      responsibleName: 'Carlos Oliveira',
      restrictionStatus: 'ABERTA',
      idUser: 1,
    },
    {
      id: 2,
      idRestriction: 20,
      responsibility: null,
      responsibleName: null,
      restrictionStatus: 'RESOLVIDA',
      idUser: 1,
    },
  ];

export const mockUpdatePublicationRestrictions: UpdatePublicationRestrictionsDTO =
  {
    id: 1,
    idRestriction: 10,
    responsibility: 'ENGENHARIA',
    responsibleName: 'Carlos Oliveira',
    restrictionStatus: 'ABERTA',
    idUser: 1,
  };

export const mockUpdatePublicationRestrictionsWithResoltuionDate: UpdatePublicationRestrictionsDTO =
  {
    id: 1,
    idRestriction: 10,
    responsibility: 'ENGENHARIA',
    responsibleName: 'Carlos Oliveira',
    restrictionStatus: 'ABERTA',
    resolutionDate: '17-12-2025',
    idUser: 1,
  };
