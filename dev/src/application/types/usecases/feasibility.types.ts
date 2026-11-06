export type StatusFeasibility = 'FORA DO PRAZO' | 'DENTRO DO PRAZO';

export type FeasibilityRejectionOutput = {
  descricao: string;
  motivo: string;
  usuario: string;
  criado_em: Date;
};

export type RejectFeasibilityInput = {
  feasibilityReportId: number;
  workId: number;
  userId: number;
  reason: string;
  description: string;
};
