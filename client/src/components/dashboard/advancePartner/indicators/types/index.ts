import { IndicatorFormat } from "../utils";

// advance-partner.types.ts
export type ReflectionKey =
  | "procReflexao"
  | "prazoReflexao"
  | "retrReflexao"
  | "wpaReflexao"
  | "cliReflexao";

export type IndicatorKey =
  | "procNumSemanasProg"
  | "procAderenciaElimRestr"
  | "procAderenciaProg"
  | "prazoAderenciaExec"
  | "prazoMultas"
  | "prazoBacklogVencidas"
  | "retrTempoResolD5"
  | "retrBacklogD5Qtd"
  | "retrBacklogD5Valor"
  | "retrTaxa"
  | "wpaOciosidade"
  | "wpaTmsSaidaBase"
  | "wpaOcupacao"
  | "wpaAderenciaDisp"
  | "cliEntradaReclamacoes"
  | "cliReclamacoesForaPrazo"
  | "cliProcedenciaReclamacoes";

// ── Dados apresentados nos cartões (vêm da API) ──────────────────────────
export interface AdvancePartnerIndicator {
  pillar: string;
  name: string;
  baseline: number | null;
  current: number | null;
  target: number | null;
  format: IndicatorFormat;
  withoutCurrency?: boolean;
  direction?: "up" | "down";
}

export interface AdvancePartnerPillarResult {
  pillar: string;
  reflection: string | null;
  indicators: AdvancePartnerIndicator[];
}

// ── Configuração do formulário de lançamento ─────────────────────────────
export interface AdvancePartnerIndicatorConfig {
  name: string;
  key: IndicatorKey;
  format: IndicatorFormat;
  direction?: "up" | "down";
  withoutCurrency?: boolean;
}

export interface AdvancePartnerPillarConfig {
  pillar: string;
  reflectionKey: ReflectionKey;
  indicators: AdvancePartnerIndicatorConfig[];
}

export interface PartnerOption {
  id: number;
  turma: string;
}

export interface AdvancePartnerFormValues {
  idParceira: number;
  mesReferencia: number;
  pillars: Record<
    string,
    { reflection: string; values: Partial<Record<IndicatorKey, string>> }
  >;
}

export type CreateAdvancePartnerPayload = {
  idParceira: number;
  mesReferencia: number;
} & Record<IndicatorKey, number> &
  Record<ReflectionKey, string>;

export type FieldErrors = Partial<
  Record<IndicatorKey | "idParceira" | "mesReferencia", string>
>;
