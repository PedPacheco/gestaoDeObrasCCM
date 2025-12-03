import { Partners } from '../common/commonInterface';

interface Restrictions {
  restricao: string;
}

interface Schedules {
  id: number;
  data_prog: Date;
  prog: number;
  exec: number | null;
  observacao_restricao: string | null;
  id_restricao_prog1: number;
  programacoes_restricao_prog1: Restrictions | null;
  responsabilidade1: string | null;
  nome_responsavel: string | null;
  area_responsavel1: string | null;
  status_restricao1: string | null;
  data_resolucao1: Date | null;
  id_restricao_prog2: number;
  programacoes_restricao_prog2: Restrictions | null;
  responsabilidade2: string | null;
  nome_responsavel2: string | null;
  area_responsavel2: string | null;
  status_restricao2: string | null;
  data_resolucao2: Date | null;
}

interface Citys {
  mun: string;
}

interface Types {
  tipo_obra: string;
}

export interface GetScheduleRestrictions {
  id: number;
  ovnota: string;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dcim: string | null;
  executado: number;
  programacoes: Schedules[];
  municipios: Citys;
  tipos: Types;
  turmas: Partners;
}
