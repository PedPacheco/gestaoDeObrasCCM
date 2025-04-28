import { Partners } from '../common/commonInterface';

export interface Schedules {
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  tipo_servico: string;
  prog: number;
  exec: number | null;
  observ_programacao: string | null;
  chi: number | null;
  num_dp: string | null;
  chave_provisoria: boolean | null;
  equipe_linha_morta: number | null;
  equipe_linha_viva: number | null;
  equipe_regularizacao: number | null;
  tecnicos: { tecnico: string | null };
  programacoes_restricao_execucao: { restricao: string | null };
  nome_responsavel_execucao: string | null;
}

export interface GetWorksDetailsResponse {
  ovnota: string;
  pep: string | null;
  status_pep: string | null;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  status_ov_sap: number | null;
  status_diagrama: string | null;
  status_usuario_diagrama: string | null;
  status_150: string | null;
  status_usuario_150: string | null;
  status_170: string | null;
  status_usuario_170: string | null;
  status_180: string | null;
  status_usuario_180: string | null;
  status_190: string | null;
  status_usuario_190: string | null;
  entrada: Date | null;
  prazo: number | null;
  data_conclusao: Date | null;
  executado: number | null;
  observ_obra: string | null;
  qtde_planejada: number | null;
  qtde_pend: number | null;
  mo_planejada: number | null;
  mo_final: number | null;
  referencia: string | null;
  capex_mat_pend: number | null;
  capex_mat_plan: number | null;
  capex_mo_pend: number | null;
  capex_mo_plan: number | null;
  tipo_ads: string | null;
  data_empreitamento: Date | null;
  ano_plan: number | null;
  circuitos: { circuito: string };
  empreendimento: { empreendimento: string | null };
  municipios: { municipio: string };
  tipos: { tipo_obra: string };
  turmas: Partners;
  status: { status: string };
  programacoes: Schedules[];
}
