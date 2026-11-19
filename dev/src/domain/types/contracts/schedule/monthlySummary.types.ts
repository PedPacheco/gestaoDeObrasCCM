import type { Partners, Types } from 'src/domain/types';

export type GetPortfolioSummaryResponse = {
  ovnota: string;
  ordem_dci: string | null;
  ordem_dca: string | null;
  ordem_dcd: string | null;
  ordem_dcim: string | null;
  mo_planejada: number;
  mo_pend: number;
  executado: number;
  id_turma: number;
  turmas: Partners;
  tipos: Types;
};

export type GetContractValueResponse = {
  id: number;
  meses: number;
  id_turma: number;
  valor_contrato?: number | null;
};

export type GetMonthlySummaryResponse = {
  obras: {
    ovnota: string;
    ordem_dci: string;
    ordem_dca: string;
    ordem_dcd: string;
    ordem_dcim: string;
    mo_planejada: number | null;
    mo_pend: number | null;
    id_turma?: number;
    turmas: Partners;
    tipos: Types;
    programacao_ponto_a_ponto: boolean;
  };
  id: number;
  prog: number;
  exec: number;
  data_prog: Date;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
};
