export type StatusType =
  | "EXECUTADA"
  | "PENDENTE"
  | "PROGRAMADA"
  | "SUSPENSA"
  | "CANCELADA";

export type StatusPrazoType =
  | "No prazo"
  | "Atenção"
  | "Urgente"
  | "Crítico"
  | "Prazo vencido";

// ── Row interface — mirrors the columns object keys exactly ──────────────────
export interface MetaProgramacao {
  id: number;
  ovnota: string;
  ordemdiagrama: string;
  restricao_aberta: boolean;
  mun: string;
  regional: string;
  conjunto: string;
  circuito: string;
  prazo_fim: string; // ISO date string
  status_prazo: StatusPrazoType | string;
  status_ov_sap: string;
  tipo_obra: string;
  qtde_planejada: number;
  qtde_pend: number;
  mo_prog: number; // formatted as currency
  mat_prog: number; // formatted as currency
  turma: string;
  executado: number; // formatted as percentage
  status: StatusType | string;
  status_programacao: string;
  data_prog: string; // ISO date string
  prog: number; // formatted as percentage
  exec: number; // formatted as percentage
  num_dp: string;
  hora_ini: string; // "1970-01-01T06:00:00Z" → HH:mm
  hora_ter: string; // "1970-01-01T17:00:00Z" → HH:mm
  equipe_linha_viva: string;
  equipe_linha_morta: string;
  equipe_regularizacao: string;
  tecnico: string;
  selected?: boolean;
}

export const columns = {
  id: "ID",
  ovnota: "Nota/Ov",
  ordemdiagrama: "Ordem",
  restricao_aberta: "Restrição !!",
  mun: "Mun",
  regional: "Regional",
  conjunto: "Conjunto",
  circuito: "Circuito",
  prazo_fim: "Prazo",
  status_prazo: "Status prazo",
  status_ov_sap: "Status SAP",
  tipo_obra: "Tipo",
  qtde_planejada: "Quantidade planejada",
  qtde_pend: "Quantidade pendente",
  mo_prog: "MO planejada",
  mat_prog: "Material planejado",
  turma: "Parceira",
  executado: "Executado",
  status: "Status da Obra",
  status_programacao: "Status da programação",
  data_prog: "Data programada",
  prog: "% Programado",
  exec: "% Executado",
  num_dp: "Número DP",
  hora_ini: "Horário Início",
  hora_ter: "Horário Término",
  equipe_linha_viva: "Equipe LV",
  equipe_linha_morta: "Equipe LM",
  equipe_regularizacao: "Equipe Reg",
  tecnico: "Técnico Responsável",
};
