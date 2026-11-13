// src/infra/repositories/contingency/contingency.rows.ts
// Formato das linhas devolvidas pelo Prisma (nomes das colunas da BD)
export type ContingencyGroupField =
  'tipo_recurso_mao_obra' | 'tipo_recurso_equipe';

export interface RecentContingencyResponse {
  id: number;
  dia_disponibilidade: Date;
  novo_tabela_usuarios: { nome: string } | null;
  turmas: { turma: string } | null;
}

export interface CapacityByYearMonthResponse {
  ano: string;
  mes: number;
  capacidade: number;
  valor: number;
}

export interface EmergencyTeamResponse {
  ano: number;
  mes: number;
  tipo: string;
  quantidade: number;
  valor: number;
}
