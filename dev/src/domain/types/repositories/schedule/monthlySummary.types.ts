import { Partners, Types } from 'src/interface/types/common/commonInterface';

import { Decimal } from '@prisma/client/runtime/library';

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
  turmas: { turma: string };
  tipos: { id_grupo: number; grupos: { grupo: string } };
};

export type GetContractValueResponse = {
  id: number;
  meses: number;
  id_turma: number;
  valor_contrato?: Decimal;
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
  };
  prog: number;
  exec: number;
  data_prog: Date;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
};
