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
